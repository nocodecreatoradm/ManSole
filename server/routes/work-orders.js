const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');

// Get all orders
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query(`
            SELECT o.*, a.nombre as activo_nombre, p.full_name as tecnico_asignado
            FROM msl.ordenes_trabajo o
            LEFT JOIN msl.activos a ON o.activo_id = a.id
            LEFT JOIN msl.profiles p ON o.tecnico_asignado_id = p.id
            ORDER BY o.created_at DESC
        `);
        res.json({ data: result.recordset, error: null });
    } catch (err) {
        console.error('GET /api/work-orders Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Create order
router.post('/', async (req, res) => {
    const { activo_id, tecnico_asignado_id, titulo, descripcion, tipo, prioridad } = req.body;
    try {
        const pool = await poolPromise;
        const codigoOT = `OT-${Date.now().toString().slice(-6)}`;
        
        const result = await pool.request()
            .input('activo_id', sql.UniqueIdentifier, activo_id)
            .input('tecnico_asignado_id', sql.UniqueIdentifier, tecnico_asignado_id || null)
            .input('titulo', sql.NVarChar, titulo)
            .input('descripcion', sql.NVarChar, descripcion)
            .input('tipo', sql.NVarChar, tipo)
            .input('prioridad', sql.NVarChar, prioridad)
            .input('codigo_ot', sql.NVarChar, codigoOT)
            .query(`
                INSERT INTO msl.ordenes_trabajo (id, codigo_ot, activo_id, tecnico_asignado_id, titulo, descripcion, tipo, prioridad, estado, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES (NEWID(), @codigo_ot, @activo_id, @tecnico_asignado_id, @titulo, @descripcion, @tipo, @prioridad, 'abierta', GETDATE(), GETDATE())
            `);
        res.json({ data: result.recordset[0], error: null });
    } catch (err) {
        console.error('POST /api/work-orders Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Update order
router.put('/:id', async (req, res) => {
    const { activo_id, tecnico_asignado_id, titulo, descripcion, tipo, prioridad, estado, observaciones_tecnicas } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .input('activo_id', sql.UniqueIdentifier, activo_id)
            .input('tecnico_asignado_id', sql.UniqueIdentifier, tecnico_asignado_id || null)
            .input('titulo', sql.NVarChar, titulo)
            .input('descripcion', sql.NVarChar, descripcion)
            .input('tipo', sql.NVarChar, tipo)
            .input('prioridad', sql.NVarChar, prioridad)
            .input('estado', sql.NVarChar, estado)
            .input('observaciones_tecnicas', sql.NVarChar, observaciones_tecnicas)
            .query(`
                UPDATE msl.ordenes_trabajo SET
                    activo_id = @activo_id,
                    tecnico_asignado_id = @tecnico_asignado_id,
                    titulo = @titulo,
                    descripcion = @descripcion,
                    tipo = @tipo,
                    prioridad = @prioridad,
                    estado = @estado,
                    observaciones_tecnicas = @observaciones_tecnicas,
                    updated_at = GETDATE()
                WHERE id = @id
            `);
        res.json({ data: { success: true }, error: null });
    } catch (err) {
        console.error('PUT /api/work-orders/:id Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// --- ACTIVITIES ROUTES ---

// Get activities for an OT
router.get('/:id/activities', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ot_id', sql.UniqueIdentifier, req.params.id)
            .query(`
                SELECT act.*, p.nombre as parte_nombre 
                FROM msl.actividades_ot act
                JOIN msl.partes_activo p ON act.parte_id = p.id
                WHERE act.ot_id = @ot_id
                ORDER BY act.created_at ASC
            `);
        res.json({ data: result.recordset, error: null });
    } catch (err) {
        console.error('GET /api/work-orders/:id/activities Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Create activity for an OT
router.post('/:id/activities', async (req, res) => {
    const { parte_id, descripcion, tipo_actividad } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ot_id', sql.UniqueIdentifier, req.params.id)
            .input('parte_id', sql.UniqueIdentifier, parte_id)
            .input('descripcion', sql.NVarChar, descripcion)
            .input('tipo_actividad', sql.NVarChar, tipo_actividad)
            .query(`
                INSERT INTO msl.actividades_ot (id, ot_id, parte_id, descripcion, tipo_actividad, created_at, estado)
                OUTPUT INSERTED.*
                VALUES (NEWID(), @ot_id, @parte_id, @descripcion, @tipo_actividad, GETDATE(), 'pendiente')
            `);
        res.json({ data: result.recordset[0], error: null });
    } catch (err) {
        console.error('POST /api/work-orders/:id/activities Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// --- USED COMPONENTS ROUTES ---

// Get used components for an activity
router.get('/activities/:activityId/components', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('actividad_id', sql.UniqueIdentifier, req.params.activityId)
            .query(`
                SELECT ca.*, cp.nombre as componente_nombre, cp.codigo as componente_codigo
                FROM msl.componentes_actividad ca
                JOIN msl.componentes_parte cp ON ca.componente_id = cp.id
                WHERE ca.actividad_id = @actividad_id
            `);
        res.json({ data: result.recordset, error: null });
    } catch (err) {
        console.error('GET /api/work-orders/activities/:activityId/components Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Add component to an activity (Solution)
router.post('/activities/:activityId/components', async (req, res) => {
    const { componente_id, cantidad, accion, observaciones } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('actividad_id', sql.UniqueIdentifier, req.params.activityId)
            .input('componente_id', sql.UniqueIdentifier, componente_id)
            .input('cantidad', sql.Int, cantidad)
            .input('accion', sql.NVarChar, accion)
            .input('observaciones', sql.NVarChar, observaciones)
            .query(`
                INSERT INTO msl.componentes_actividad (id, actividad_id, componente_id, cantidad, accion, observaciones, created_at)
                OUTPUT INSERTED.*
                VALUES (NEWID(), @actividad_id, @componente_id, @cantidad, @accion, @observaciones, GETDATE())
            `);
        res.json({ data: result.recordset[0], error: null });
    } catch (err) {
        console.error('POST /api/work-orders/activities/:activityId/components Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// --- SPARE PARTS (REPUESTOS) ROUTES ---

// Get used spare parts for an OT
router.get('/:id/parts', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ot_id', sql.UniqueIdentifier, req.params.id)
            .query(`
                SELECT opr.*, r.nombre as repuesto_nombre, r.codigo as repuesto_codigo, r.uom
                FROM msl.ot_repuestos opr
                JOIN msl.repuestos r ON opr.repuesto_id = r.id
                WHERE opr.ot_id = @ot_id
            `);
        res.json({ data: result.recordset, error: null });
    } catch (err) {
        console.error('GET /api/work-orders/:id/parts Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Add spare part to an OT and discount from inventory
router.post('/:id/parts', async (req, res) => {
    const { repuesto_id, cantidad, usuario_id } = req.body;
    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 1. Get current cost and check stock
            const partInfo = await transaction.request()
                .input('id', sql.UniqueIdentifier, repuesto_id)
                .query(`SELECT costo_unitario, stock_actual, nombre FROM msl.repuestos WHERE id = @id`);
            
            if (partInfo.recordset.length === 0) throw new Error('Repuesto no encontrado');
            if (partInfo.recordset[0].stock_actual < cantidad) {
                throw new Error(`Stock insuficiente para ${partInfo.recordset[0].nombre}. Disponible: ${partInfo.recordset[0].stock_actual}`);
            }

            const costoUnitario = partInfo.recordset[0].costo_unitario;

            // 2. Link to OT
            await transaction.request()
                .input('ot_id', sql.UniqueIdentifier, req.params.id)
                .input('repuesto_id', sql.UniqueIdentifier, repuesto_id)
                .input('cantidad', sql.Decimal(18, 2), cantidad)
                .input('costo', sql.Decimal(18, 2), costoUnitario)
                .query(`
                    INSERT INTO msl.ot_repuestos (id, ot_id, repuesto_id, cantidad, costo_unitario_aplicado, created_at)
                    VALUES (NEWID(), @ot_id, @repuesto_id, @cantidad, @costo, GETDATE())
                `);

            // 3. Record movement in inventory history
            await transaction.request()
                .input('repuesto_id', sql.UniqueIdentifier, repuesto_id)
                .input('cantidad', sql.Decimal(18, 2), cantidad)
                .input('referencia_id', sql.NVarChar, req.params.id)
                .input('usuario_id', sql.UniqueIdentifier, usuario_id)
                .query(`
                    INSERT INTO msl.inventario_movimientos (id, repuesto_id, tipo, cantidad, referencia_tipo, referencia_id, usuario_id, notas, fecha_movimiento)
                    VALUES (NEWID(), @repuesto_id, 'salida', @cantidad, 'OT', @referencia_id, @usuario_id, 'Consumo en OT', GETDATE())
                `);

            // 4. Update main stock
            await transaction.request()
                .input('id', sql.UniqueIdentifier, repuesto_id)
                .input('cantidad', sql.Decimal(18, 2), cantidad)
                .query(`UPDATE msl.repuestos SET stock_actual = stock_actual - @cantidad, updated_at = GETDATE() WHERE id = @id`);

            // 5. Update total cost in OT (optional but good for tracking)
            await transaction.request()
                .input('ot_id', sql.UniqueIdentifier, req.params.id)
                .input('costo_adicional', sql.Decimal(18, 2), cantidad * costoUnitario)
                .query(`UPDATE msl.ordenes_trabajo SET costo_materiales = ISNULL(costo_materiales, 0) + @costo_adicional WHERE id = @ot_id`);

            await transaction.commit();
            res.json({ data: { success: true }, error: null });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('POST /api/work-orders/:id/parts Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

module.exports = router;
