const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { poolPromise, sql } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'mansole_secret_123';

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM msl.profiles WHERE email = @email');
        
        const user = result.recordset[0];
        if (!user) {
            return res.status(401).json({ data: null, error: 'Credenciales inválidas' });
        }

        // For now, if password_hash is null, allow any password (dev mode)
        // or just check against a plain text for demo if we haven't hashed yet.
        // Let's assume bcrypt if it exists.
        if (user.password_hash) {
            const valid = await bcrypt.compare(password, user.password_hash);
            if (!valid) return res.status(401).json({ data: null, error: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ data: { user, token }, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

// Register
router.post('/register', async (req, res) => {
    const { email, password, fullName } = req.body;
    try {
        const pool = await poolPromise;
        const passwordHash = await bcrypt.hash(password, 10);
        const userId = `u_${Date.now()}`;
        
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('full_name', sql.NVarChar, fullName)
            .input('password_hash', sql.NVarChar, passwordHash)
            .input('user_id', sql.NVarChar, userId)
            .input('role', sql.NVarChar, 'operador')
            .query(`
                INSERT INTO msl.profiles (id, user_id, email, full_name, password_hash, role, is_active, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES (NEWID(), @user_id, @email, @full_name, @password_hash, @role, 1, GETDATE(), GETDATE())
            `);
        
        const user = result.recordset[0];
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ data: { user, token }, error: null });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Me (Get current profile)
router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, decoded.id)
            .query('SELECT * FROM msl.profiles WHERE id = @id');
        
        res.json({ data: result.recordset[0], error: null });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Get all profiles (Admin only)
router.get('/profiles', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query('SELECT * FROM msl.profiles ORDER BY full_name');
        res.json({ data: result.recordset, error: null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update profile
router.put('/profiles/:id', async (req, res) => {
    const { id } = req.params;
    const { role, is_active } = req.body;
    try {
        const pool = await poolPromise;
        const request = pool.request().input('id', sql.UniqueIdentifier, id);
        
        let query = 'UPDATE msl.profiles SET ';
        const updates = [];
        if (role !== undefined) {
            updates.push('role = @role');
            request.input('role', sql.NVarChar, role);
        }
        if (is_active !== undefined) {
            updates.push('is_active = @is_active');
            request.input('is_active', sql.Bit, is_active);
        }
        
        if (updates.length === 0) return res.json({ success: true });
        
        query += updates.join(', ') + ' WHERE id = @id';
        await request.query(query);
        res.json({ data: { success: true }, error: null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
