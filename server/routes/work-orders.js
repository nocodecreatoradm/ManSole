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

module.exports = router;
