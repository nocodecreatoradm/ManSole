const cron = require('node-cron');
const { poolPromise, sql } = require('../db');

/**
 * Genera órdenes de trabajo automáticas basadas en los planes preventivos.
 */
async function generatePreventiveWorkOrders() {
  console.log('[Cron] Iniciando generación de órdenes de trabajo preventivas...');
  
  try {
    const pool = await poolPromise;
    
    // 1. Obtener planes que necesitan ejecución
    // Consideramos planes activos cuya próxima fecha es hoy o anterior
    const result = await pool.request().query(`
      SELECT p.*, a.nombre as activo_nombre
      FROM msl.planes_preventivos p
      JOIN msl.Activos a ON p.activo_id = a.id
      WHERE p.is_active = 1 
      AND p.proxima_fecha <= CAST(GETDATE() AS DATE)
    `);

    const planes = result.recordset;
    console.log(`[Cron] Se encontraron ${planes.length} planes para procesar.`);

    for (const plan of planes) {
      const transaction = new sql.Transaction(pool);
      try {
        await transaction.begin();
        
        // Generar código de OT: PM-YYYYMMDD-PLANID(short)
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const planShortId = plan.id.toString().slice(0, 4);
        const codigoOT = `PM-${dateStr}-${planShortId}`;

        // 2. Crear Orden de Trabajo
        await transaction.request()
          .input('codigo_ot', sql.NVarChar, codigoOT)
          .input('activo_id', sql.UniqueIdentifier, plan.activo_id)
          .input('tipo', sql.NVarChar, 'Preventivo')
          .input('prioridad', sql.NVarChar, plan.prioridad)
          .input('estado', sql.NVarChar, 'Pendiente')
          .input('titulo', sql.NVarChar, plan.nombre)
          .input('descripcion', sql.NVarChar, plan.descripcion || 'Mantenimiento preventivo programado')
          .input('fecha_programada', sql.DateTime2, plan.proxima_fecha)
          .input('created_at', sql.DateTime2, new Date())
          .query(`
            INSERT INTO msl.ordenes_trabajo (id, codigo_ot, activo_id, tipo, prioridad, estado, titulo, descripcion, fecha_programada, created_at)
            VALUES (NEWID(), @codigo_ot, @activo_id, @tipo, @prioridad, @estado, @titulo, @descripcion, @fecha_programada, @created_at)
          `);

        // 3. Actualizar Plan Preventivo
        await transaction.request()
          .input('id', sql.UniqueIdentifier, plan.id)
          .input('ultima_fecha', sql.Date, plan.proxima_fecha)
          .input('frecuencia', sql.Int, plan.frecuencia_dias)
          .query(`
            UPDATE msl.planes_preventivos
            SET ultima_fecha = @ultima_fecha,
                proxima_fecha = DATEADD(day, @frecuencia, @ultima_fecha),
                updated_at = GETDATE()
            WHERE id = @id
          `);

        await transaction.commit();
        console.log(`[Cron] OT ${codigoOT} generada para el activo: ${plan.activo_nombre}`);
      } catch (err) {
        await transaction.rollback();
        console.error(`[Cron] Error procesando plan ${plan.id}:`, err);
      }
    }
    
    console.log('[Cron] Proceso de generación preventiva finalizado.');
  } catch (error) {
    console.error('[Cron] Error crítico en generatePreventiveWorkOrders:', error);
  }
}

// Programar la tarea para que corra todos los días a la medianoche (00:00)
const setupCronTasks = () => {
  cron.schedule('0 0 * * *', () => {
    generatePreventiveWorkOrders();
  });
  
  console.log('[Cron] Tareas programadas correctamente (Diario 00:00).');
};

module.exports = {
  setupCronTasks,
  generatePreventiveWorkOrders // Exportar para trigger manual si es necesario
};
