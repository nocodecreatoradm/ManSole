const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');

// Get all spare parts
router.get('/parts', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT * FROM msl.repuestos 
            WHERE is_active = 1
            ORDER BY nombre ASC
        `);
        res.json({ data: result.recordset, error: null });
    } catch (err) {
        console.error('GET /api/inventory/parts Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Create spare part
router.post('/parts', async (req, res) => {
    const { codigo, nombre, descripcion, categoria, uom, stock_minimo, costo_unitario, ubicacion } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('codigo', sql.NVarChar, codigo)
            .input('nombre', sql.NVarChar, nombre)
            .input('descripcion', sql.NVarChar, descripcion)
            .input('categoria', sql.NVarChar, categoria)
            .input('uom', sql.NVarChar, uom || 'unidades')
            .input('stock_minimo', sql.Decimal(18, 2), stock_minimo || 0)
            .input('costo_unitario', sql.Decimal(18, 2), costo_unitario || 0)
            .input('ubicacion', sql.NVarChar, ubicacion)
            .query(`
                INSERT INTO msl.repuestos (id, codigo, nombre, descripcion, categoria, uom, stock_actual, stock_minimo, costo_unitario, ubicacion, is_active, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES (NEWID(), @codigo, @nombre, @descripcion, @categoria, @uom, 0, @stock_minimo, @costo_unitario, @ubicacion, 1, GETDATE(), GETDATE())
            `);
        res.json({ data: result.recordset[0], error: null });
    } catch (err) {
        console.error('POST /api/inventory/parts Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Record inventory movement (Input/Output/Adjustment)
router.post('/movements', async (req, res) => {
    const { repuesto_id, tipo, cantidad, referencia_tipo, referencia_id, notas, usuario_id } = req.body;
    
    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        
        await transaction.begin();
        
        try {
            // 1. Record the movement
            await transaction.request()
                .input('repuesto_id', sql.UniqueIdentifier, repuesto_id)
                .input('tipo', sql.NVarChar, tipo)
                .input('cantidad', sql.Decimal(18, 2), cantidad)
                .input('referencia_tipo', sql.NVarChar, referencia_tipo)
                .input('referencia_id', sql.NVarChar, referencia_id)
                .input('usuario_id', sql.UniqueIdentifier, usuario_id)
                .input('notas', sql.NVarChar, notas)
                .query(`
                    INSERT INTO msl.inventario_movimientos (id, repuesto_id, tipo, cantidad, referencia_tipo, referencia_id, usuario_id, notas, fecha_movimiento)
                    VALUES (NEWID(), @repuesto_id, @tipo, @cantidad, @referencia_tipo, @referencia_id, @usuario_id, @notas, GETDATE())
                `);

            // 2. Update the stock level
            const stockChange = tipo === 'entrada' ? cantidad : (tipo === 'salida' ? -cantidad : cantidad); // 'ajuste' assumes quantity is the delta
            
            await transaction.request()
                .input('id', sql.UniqueIdentifier, repuesto_id)
                .input('delta', sql.Decimal(18, 2), stockChange)
                .query(`
                    UPDATE msl.repuestos 
                    SET stock_actual = stock_actual + @delta,
                        updated_at = GETDATE()
                    WHERE id = @id
                `);

            await transaction.commit();
            res.json({ data: { success: true }, error: null });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('POST /api/inventory/movements Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Get movements history for a part
router.get('/parts/:id/movements', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('repuesto_id', sql.UniqueIdentifier, req.params.id)
            .query(`
                SELECT m.*, u.full_name as usuario_nombre
                FROM msl.inventario_movimientos m
                LEFT JOIN msl.usuarios u ON m.usuario_id = u.id
                WHERE m.repuesto_id = @repuesto_id
                ORDER BY m.fecha_movimiento DESC
            `);
        res.json({ data: result.recordset, error: null });
    } catch (err) {
        console.error('GET /api/inventory/parts/:id/movements Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

module.exports = router;
