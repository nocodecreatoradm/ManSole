const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');

// Get all assets
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT a.*, ar.nombre as area_nombre, c.nombre as categoria_nombre
            FROM msl.activos a
            LEFT JOIN msl.areas ar ON a.area_id = ar.id
            LEFT JOIN msl.categorias_activos c ON a.categoria_id = c.id
            ORDER BY a.codigo
        `);
        res.json({ data: result.recordset, error: null });
    } catch (err) {
        console.error('GET /api/assets Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Get all categories
router.get('/categories', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query('SELECT * FROM msl.categorias_activos ORDER BY nombre');
        res.json({ data: result.recordset, error: null });
    } catch (err) {
        console.error('GET /api/assets/categories Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Get asset by ID
router.get('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .query('SELECT * FROM msl.activos WHERE id = @id');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ data: null, error: 'Asset not found' });
        }
        res.json({ data: result.recordset[0], error: null });
    } catch (err) {
        console.error('GET /api/assets/:id Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Create asset
router.post('/', async (req, res) => {
    const { codigo, nombre, descripcion, area_id, categoria_id, marca, modelo, numero_serie, fecha_adquisicion, fecha_fin_garantia, prioridad_criticidad, estado } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('codigo', sql.NVarChar, codigo)
            .input('nombre', sql.NVarChar, nombre)
            .input('descripcion', sql.NVarChar, descripcion)
            .input('area_id', sql.UniqueIdentifier, area_id)
            .input('categoria_id', sql.UniqueIdentifier, categoria_id || null)
            .input('marca', sql.NVarChar, marca)
            .input('modelo', sql.NVarChar, modelo)
            .input('numero_serie', sql.NVarChar, numero_serie)
            .input('fecha_adquisicion', sql.Date, fecha_adquisicion || null)
            .input('fecha_fin_garantia', sql.Date, fecha_fin_garantia || null)
            .input('prioridad_criticidad', sql.NVarChar, prioridad_criticidad)
            .input('estado', sql.NVarChar, estado || 'operativo')
            .query(`
                INSERT INTO msl.activos (id, codigo, nombre, descripcion, area_id, categoria_id, marca, modelo, numero_serie, fecha_adquisicion, fecha_fin_garantia, prioridad_criticidad, estado, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES (NEWID(), @codigo, @nombre, @descripcion, @area_id, @categoria_id, @marca, @modelo, @numero_serie, @fecha_adquisicion, @fecha_fin_garantia, @prioridad_criticidad, @estado, GETDATE(), GETDATE())
            `);
        res.json({ data: result.recordset[0], error: null });
    } catch (err) {
        console.error('POST /api/assets Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Update asset
router.put('/:id', async (req, res) => {
    const { codigo, nombre, descripcion, area_id, categoria_id, marca, modelo, numero_serie, fecha_adquisicion, fecha_fin_garantia, prioridad_criticidad, estado } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .input('codigo', sql.NVarChar, codigo)
            .input('nombre', sql.NVarChar, nombre)
            .input('descripcion', sql.NVarChar, descripcion)
            .input('area_id', sql.UniqueIdentifier, area_id)
            .input('categoria_id', sql.UniqueIdentifier, categoria_id || null)
            .input('marca', sql.NVarChar, marca)
            .input('modelo', sql.NVarChar, modelo)
            .input('numero_serie', sql.NVarChar, numero_serie)
            .input('fecha_adquisicion', sql.Date, fecha_adquisicion || null)
            .input('fecha_fin_garantia', sql.Date, fecha_fin_garantia || null)
            .input('prioridad_criticidad', sql.NVarChar, prioridad_criticidad)
            .input('estado', sql.NVarChar, estado)
            .query(`
                UPDATE msl.activos SET
                    codigo = @codigo,
                    nombre = @nombre,
                    descripcion = @descripcion,
                    area_id = @area_id,
                    categoria_id = @categoria_id,
                    marca = @marca,
                    modelo = @modelo,
                    numero_serie = @numero_serie,
                    fecha_adquisicion = @fecha_adquisicion,
                    fecha_fin_garantia = @fecha_fin_garantia,
                    prioridad_criticidad = @prioridad_criticidad,
                    estado = @estado,
                    updated_at = GETDATE()
                WHERE id = @id
            `);
        res.json({ data: { success: true }, error: null });
    } catch (err) {
        console.error('PUT /api/assets/:id Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// --- PARTS ROUTES ---

// Get parts for an asset
router.get('/:id/parts', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('activo_id', sql.UniqueIdentifier, req.params.id)
            .query('SELECT * FROM msl.partes_activo WHERE activo_id = @activo_id ORDER BY codigo');
        res.json({ data: result.recordset, error: null });
    } catch (err) {
        console.error('GET /api/assets/:id/parts Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Create part for an asset
router.post('/:id/parts', async (req, res) => {
    const { codigo, nombre, descripcion } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('activo_id', sql.UniqueIdentifier, req.params.id)
            .input('codigo', sql.NVarChar, codigo)
            .input('nombre', sql.NVarChar, nombre)
            .input('descripcion', sql.NVarChar, descripcion)
            .query(`
                INSERT INTO msl.partes_activo (id, activo_id, codigo, nombre, descripcion, created_at)
                OUTPUT INSERTED.*
                VALUES (NEWID(), @activo_id, @codigo, @nombre, @descripcion, GETDATE())
            `);
        res.json({ data: result.recordset[0], error: null });
    } catch (err) {
        console.error('POST /api/assets/:id/parts Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// --- COMPONENTS ROUTES ---

// Get components for a part
router.get('/parts/:partId/components', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('parte_id', sql.UniqueIdentifier, req.params.partId)
            .query('SELECT * FROM msl.componentes_parte WHERE parte_id = @parte_id ORDER BY codigo');
        res.json({ data: result.recordset, error: null });
    } catch (err) {
        console.error('GET /api/assets/parts/:partId/components Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Create component for a part
router.post('/parts/:partId/components', async (req, res) => {
    const { codigo, nombre, descripcion, numero_parte } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('parte_id', sql.UniqueIdentifier, req.params.partId)
            .input('codigo', sql.NVarChar, codigo)
            .input('nombre', sql.NVarChar, nombre)
            .input('descripcion', sql.NVarChar, descripcion)
            .input('numero_parte', sql.NVarChar, numero_parte)
            .query(`
                INSERT INTO msl.componentes_parte (id, parte_id, codigo, nombre, descripcion, numero_parte, created_at)
                OUTPUT INSERTED.*
                VALUES (NEWID(), @parte_id, @codigo, @nombre, @descripcion, @numero_parte, GETDATE())
            `);
        res.json({ data: result.recordset[0], error: null });
    } catch (err) {
        console.error('POST /api/assets/parts/:partId/components Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

module.exports = router;
