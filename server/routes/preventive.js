const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');

// Get all preventive plans
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT p.*, a.nombre as activo_nombre, a.codigo as activo_codigo
            FROM msl.planes_preventivos p
            JOIN msl.activos a ON p.activo_id = a.id
            WHERE p.is_active = 1
            ORDER BY p.proxima_fecha ASC
        `);
        res.json({ data: result.recordset, error: null });
    } catch (err) {
        console.error('GET /api/preventive Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Create preventive plan
router.post('/', async (req, res) => {
    const { activo_id, nombre, descripcion, frecuencia_dias, proxima_fecha, prioridad } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('activo_id', sql.UniqueIdentifier, activo_id)
            .input('nombre', sql.NVarChar, nombre)
            .input('descripcion', sql.NVarChar, descripcion)
            .input('frecuencia_dias', sql.Int, frecuencia_dias)
            .input('proxima_fecha', sql.Date, proxima_fecha)
            .input('prioridad', sql.NVarChar, prioridad || 'media')
            .query(`
                INSERT INTO msl.planes_preventivos (id, activo_id, nombre, descripcion, frecuencia_dias, proxima_fecha, prioridad, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES (NEWID(), @activo_id, @nombre, @descripcion, @frecuencia_dias, @proxima_fecha, @prioridad, GETDATE(), GETDATE())
            `);
        res.json({ data: result.recordset[0], error: null });
    } catch (err) {
        console.error('POST /api/preventive Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Update preventive plan
router.put('/:id', async (req, res) => {
    const { nombre, descripcion, frecuencia_dias, proxima_fecha, prioridad, is_active } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .input('nombre', sql.NVarChar, nombre)
            .input('descripcion', sql.NVarChar, descripcion)
            .input('frecuencia_dias', sql.Int, frecuencia_dias)
            .input('proxima_fecha', sql.Date, proxima_fecha)
            .input('prioridad', sql.NVarChar, prioridad)
            .input('is_active', sql.Bit, is_active)
            .query(`
                UPDATE msl.planes_preventivos SET
                    nombre = @nombre,
                    descripcion = @descripcion,
                    frecuencia_dias = @frecuencia_dias,
                    proxima_fecha = @proxima_fecha,
                    prioridad = @prioridad,
                    is_active = @is_active,
                    updated_at = GETDATE()
                WHERE id = @id
            `);
        res.json({ data: { success: true }, error: null });
    } catch (err) {
        console.error('PUT /api/preventive/:id Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Delete (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .query('UPDATE msl.planes_preventivos SET is_active = 0 WHERE id = @id');
        res.json({ data: { success: true }, error: null });
    } catch (err) {
        console.error('DELETE /api/preventive/:id Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

const { generatePreventiveWorkOrders } = require('../services/preventiveTask');

// Trigger manual generation
router.post('/generate-orders', async (req, res) => {
    try {
        await generatePreventiveWorkOrders();
        res.json({ data: { success: true, message: 'Proceso de generación iniciado' }, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

module.exports = router;
