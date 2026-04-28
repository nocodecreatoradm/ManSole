const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');

// Get all plants
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query('SELECT * FROM msl.plantas ORDER BY nombre');
        res.json({ data: result.recordset, error: null });
    } catch (err) {
        console.error('GET /api/plants Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get all areas with plant name
router.get('/areas', async (req, res) => {
    const { plantaId } = req.query;
    try {
        const pool = await poolPromise;
        let query = `
            SELECT a.*, p.nombre as planta_nombre 
            FROM msl.areas a
            LEFT JOIN msl.plantas p ON a.planta_id = p.id
        `;
        const request = pool.request();
        
        if (plantaId) {
            query += ' WHERE a.planta_id = @plantaId';
            request.input('plantaId', sql.UniqueIdentifier, plantaId);
        }
        
        query += ' ORDER BY a.nombre';
        const result = await request.query(query);
        res.json({ data: result.recordset, error: null });
    } catch (err) {
        console.error('GET /api/plants/areas Error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
