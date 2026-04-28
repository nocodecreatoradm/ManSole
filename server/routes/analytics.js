const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');

// Global KPIs: MTTR, MTBF, Availability
router.get('/kpis', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query(`
            DECLARE @TotalTimeHours FLOAT;
            SET @TotalTimeHours = 720; -- Last 30 days (30 * 24)

            WITH Stats AS (
                SELECT 
                    COUNT(*) as Failures,
                    SUM(DATEDIFF(MINUTE, fecha_inicio, fecha_fin)) / 60.0 as TotalRepairTime,
                    AVG(DATEDIFF(MINUTE, fecha_inicio, fecha_fin)) / 60.0 as MTTR
                FROM msl.ordenes_trabajo
                WHERE tipo = 'correctiva' 
                  AND estado = 'completada'
                  AND fecha_inicio IS NOT NULL 
                  AND fecha_fin IS NOT NULL
                  AND created_at >= DATEADD(day, -30, GETDATE())
            )
            SELECT 
                COALESCE(MTTR, 0) as MTTR,
                COALESCE((@TotalTimeHours - COALESCE(TotalRepairTime, 0)) / NULLIF(Failures, 0), @TotalTimeHours) as MTBF,
                COALESCE(Failures, 0) as TotalFailures,
                CASE 
                    WHEN COALESCE(Failures, 0) = 0 THEN 100.0
                    ELSE ((@TotalTimeHours - COALESCE(TotalRepairTime, 0)) / @TotalTimeHours) * 100.0
                END as Availability
            FROM Stats
        `);
        res.json({ data: result.recordset[0], error: null });
    } catch (err) {
        console.error('GET /api/analytics/kpis Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Maintenance Trends (OTs by month)
router.get('/trends', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query(`
            SELECT 
                FORMAT(created_at, 'MMM') as month,
                COUNT(*) as count,
                SUM(CASE WHEN tipo = 'preventiva' THEN 1 ELSE 0 END) as preventive,
                SUM(CASE WHEN tipo = 'correctiva' THEN 1 ELSE 0 END) as corrective
            FROM msl.ordenes_trabajo
            WHERE created_at >= DATEADD(month, -6, GETDATE())
            GROUP BY FORMAT(created_at, 'MMM'), MONTH(created_at)
            ORDER BY MONTH(created_at)
        `);
        res.json({ data: result.recordset, error: null });
    } catch (err) {
        console.error('GET /api/analytics/trends Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Asset Health Distribution
router.get('/asset-health', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query(`
            SELECT 
                estado,
                COUNT(*) as count
            FROM msl.activos
            GROUP BY estado
        `);
        res.json({ data: result.recordset, error: null });
    } catch (err) {
        console.error('GET /api/analytics/asset-health Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Specific Asset Metrics
router.get('/assets/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .query(`
                SELECT 
                    COUNT(*) as total_ots,
                    SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as completed_ots,
                    AVG(DATEDIFF(MINUTE, fecha_inicio, fecha_fin)) / 60.0 as avg_repair_time
                FROM msl.ordenes_trabajo
                WHERE activo_id = @id
            `);
        res.json({ data: result.recordset[0], error: null });
    } catch (err) {
        console.error('GET /api/analytics/assets/:id Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// High Performance Dashboard Summary
router.get('/dashboard-summary', async (req, res) => {
    try {
        const pool = await poolPromise;
        
        // Execute multiple queries in parallel for maximum speed
        const [kpiRes, trendRes, assetRes, otRes, recentAssetsRes, otStatsRes] = await Promise.all([
            pool.query(`
                DECLARE @TotalTimeHours FLOAT = 720;
                WITH Stats AS (
                    SELECT COUNT(*) as Failures, SUM(DATEDIFF(MINUTE, fecha_inicio, fecha_fin)) / 60.0 as TotalRepairTime
                    FROM msl.ordenes_trabajo
                    WHERE tipo = 'correctiva' AND estado = 'completada' AND fecha_inicio IS NOT NULL AND fecha_fin IS NOT NULL AND created_at >= DATEADD(day, -30, GETDATE())
                )
                SELECT 
                    COALESCE(TotalRepairTime / NULLIF(Failures, 0), 0) as MTTR,
                    COALESCE((@TotalTimeHours - COALESCE(TotalRepairTime, 0)) / NULLIF(Failures, 0), @TotalTimeHours) as MTBF,
                    COALESCE(Failures, 0) as TotalFailures,
                    CASE WHEN COALESCE(Failures, 0) = 0 THEN 100.0 ELSE ((@TotalTimeHours - COALESCE(TotalRepairTime, 0)) / @TotalTimeHours) * 100.0 END as Availability
                FROM Stats
            `),
            pool.query(`
                SELECT TOP 6 FORMAT(created_at, 'MMM') as month, COUNT(*) as count,
                       SUM(CASE WHEN tipo = 'preventiva' THEN 1 ELSE 0 END) as preventive,
                       SUM(CASE WHEN tipo = 'correctiva' THEN 1 ELSE 0 END) as corrective
                FROM msl.ordenes_trabajo
                WHERE created_at >= DATEADD(month, -6, GETDATE())
                GROUP BY FORMAT(created_at, 'MMM'), MONTH(created_at)
                ORDER BY MONTH(created_at)
            `),
            pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM msl.activos) as total,
                    (SELECT COUNT(*) FROM msl.activos WHERE estado = 'operativo') as operativos,
                    (SELECT COUNT(*) FROM msl.activos WHERE estado = 'en_mantenimiento') as en_mantenimiento,
                    (SELECT COUNT(*) FROM msl.activos WHERE estado = 'fuera_de_servicio') as fuera_de_servicio
            `),
            pool.query(`
                SELECT TOP 5 o.id, o.codigo_ot, o.titulo, o.estado, o.prioridad, o.created_at, a.nombre as activo_nombre
                FROM msl.ordenes_trabajo o
                LEFT JOIN msl.activos a ON o.activo_id = a.id
                ORDER BY o.created_at DESC
            `),
            pool.query(`
                SELECT TOP 5 a.id, a.codigo, a.nombre, a.estado, ar.nombre as area_nombre
                FROM msl.activos a
                LEFT JOIN msl.areas ar ON a.area_id = ar.id
                WHERE a.estado IN ('en_mantenimiento', 'fuera_de_servicio')
                ORDER BY a.updated_at DESC
            `),
            pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM msl.ordenes_trabajo WHERE estado IN ('solicitada', 'aprobada')) as abiertas,
                    (SELECT COUNT(*) FROM msl.ordenes_trabajo WHERE estado = 'en_proceso') as en_proceso,
                    (SELECT COUNT(*) FROM msl.ordenes_trabajo WHERE estado IN ('completada', 'cerrada')) as completadas,
                    (SELECT COUNT(*) FROM msl.ordenes_trabajo WHERE prioridad = 'critica' AND estado NOT IN ('cerrada', 'cancelada', 'completada')) as criticas
            `)
        ]);

        res.json({
            data: {
                kpis: kpiRes.recordset[0],
                trends: trendRes.recordset,
                assetStats: assetRes.recordset[0],
                recentOTs: otRes.recordset,
                recentAssets: recentAssetsRes.recordset,
                otStats: otStatsRes.recordset[0]
            },
            error: null
        });
    } catch (err) {
        console.error('GET /api/analytics/dashboard-summary Error:', err);
        res.status(500).json({ data: null, error: err.message });
    }
});

module.exports = router;
