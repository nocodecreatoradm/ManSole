const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');

// Get all requests
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query(`
            SELECT r.*, a.nombre as activo_nombre, p.full_name as solicitante_nombre
            FROM msl.solicitudes_trabajo r
            LEFT JOIN msl.activos a ON r.activo_id = a.id
            LEFT JOIN msl.profiles p ON r.solicitante_id = p.id
            ORDER BY r.created_at DESC
        `);
        res.json({ data: result.recordset, error: null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create request
router.post('/', async (req, res) => {
    const { activo_id, solicitante_id, titulo, descripcion, prioridad } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('activo_id', sql.UniqueIdentifier, activo_id)
            .input('solicitante_id', sql.UniqueIdentifier, solicitante_id)
            .input('titulo', sql.NVarChar, titulo)
            .input('descripcion', sql.NVarChar, descripcion)
            .input('prioridad', sql.NVarChar, prioridad)
            .query(`
                INSERT INTO msl.solicitudes_trabajo (activo_id, solicitante_id, titulo, descripcion, prioridad, estado)
                VALUES (@activo_id, @solicitante_id, @titulo, @descripcion, @prioridad, 'pendiente')
            `);
        res.json({ data: { success: true }, error: null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
