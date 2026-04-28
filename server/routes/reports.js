const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { poolPromise } = require('../db');

// Export Assets to PDF
router.get('/assets/pdf', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query(`
            SELECT a.*, ar.nombre as area_nombre, c.nombre as categoria_nombre
            FROM msl.activos a
            LEFT JOIN msl.areas ar ON a.area_id = ar.id
            LEFT JOIN msl.categorias_activos c ON a.categoria_id = c.id
        `);
        const assets = result.recordset;

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Inventario_Activos_ManSole.pdf');
        
        doc.pipe(res);

        // Header
        doc.fontSize(20).text('MANSOLE - Sistema de Gestión de Activos', { align: 'center' });
        doc.fontSize(14).text('Inventario General de Activos', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Fecha de generación: ${new Date().toLocaleString()}`, { align: 'right' });
        doc.moveDown();

        // Table Header
        const tableTop = 150;
        const itemCodeX = 30;
        const itemNameX = 100;
        const itemAreaX = 250;
        const itemStatusX = 400;
        const itemCriticidadX = 500;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Código', itemCodeX, tableTop);
        doc.text('Nombre', itemNameX, tableTop);
        doc.text('Área', itemAreaX, tableTop);
        doc.text('Estado', itemStatusX, tableTop);
        doc.text('Criticidad', itemCriticidadX, tableTop);

        doc.moveTo(30, tableTop + 15).lineTo(570, tableTop + 15).stroke();

        // Table Rows
        let y = tableTop + 25;
        doc.font('Helvetica');
        
        assets.forEach(asset => {
            if (y > 750) {
                doc.addPage();
                y = 50;
            }
            doc.text(asset.codigo || '', itemCodeX, y);
            doc.text(asset.nombre || '', itemNameX, y, { width: 140 });
            doc.text(asset.area_nombre || '', itemAreaX, y);
            doc.text(asset.estado || '', itemStatusX, y);
            doc.text(asset.prioridad_criticidad || '', itemCriticidadX, y);
            y += 25;
        });

        doc.end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export Assets to Excel
router.get('/assets/excel', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query(`
            SELECT a.*, ar.nombre as area_nombre, c.nombre as categoria_nombre
            FROM msl.activos a
            LEFT JOIN msl.areas ar ON a.area_id = ar.id
            LEFT JOIN msl.categorias_activos c ON a.categoria_id = c.id
        `);
        const assets = result.recordset;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Activos');

        worksheet.columns = [
            { header: 'Código', key: 'codigo', width: 15 },
            { header: 'Nombre', key: 'nombre', width: 30 },
            { header: 'Descripción', key: 'descripcion', width: 40 },
            { header: 'Área', key: 'area_nombre', width: 20 },
            { header: 'Categoría', key: 'categoria_nombre', width: 20 },
            { header: 'Marca', key: 'marca', width: 15 },
            { header: 'Modelo', key: 'modelo', width: 15 },
            { header: 'Estado', key: 'estado', width: 15 },
            { header: 'Criticidad', key: 'prioridad_criticidad', width: 15 },
            { header: 'Fecha Adquisición', key: 'fecha_adquisicion', width: 20 },
        ];

        worksheet.addRows(assets);

        // Styling the header
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F81BD' }
        };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Inventario_Activos_ManSole.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export Work Orders to PDF
router.get('/work-orders/pdf', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query(`
            SELECT ot.*, a.nombre as activo_nombre, p.full_name as tecnico_nombre
            FROM msl.ordenes_trabajo ot
            LEFT JOIN msl.activos a ON ot.activo_id = a.id
            LEFT JOIN msl.profiles p ON ot.tecnico_asignado_id = p.id
            ORDER BY ot.created_at DESC
        `);
        const orders = result.recordset;

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Reporte_OTs_ManSole.pdf');
        doc.pipe(res);

        doc.fontSize(20).text('MANSOLE CMMS', { align: 'center' });
        doc.fontSize(14).text('Reporte de Órdenes de Trabajo', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Fecha: ${new Date().toLocaleString()}`, { align: 'right' });
        doc.moveDown();

        const tableTop = 150;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Código', 30, tableTop);
        doc.text('Título', 90, tableTop);
        doc.text('Equipo', 240, tableTop);
        doc.text('Técnico', 380, tableTop);
        doc.text('Estado', 500, tableTop);

        doc.moveTo(30, tableTop + 15).lineTo(570, tableTop + 15).stroke();

        let y = tableTop + 25;
        doc.font('Helvetica');
        orders.forEach(ot => {
            if (y > 750) { doc.addPage(); y = 50; }
            doc.text(ot.codigo_ot || '', 30, y);
            doc.text(ot.titulo || '', 90, y, { width: 140 });
            doc.text(ot.activo_nombre || '', 240, y, { width: 130 });
            doc.text(ot.tecnico_nombre || '—', 380, y);
            doc.text(ot.estado || '', 500, y);
            y += 25;
        });

        doc.end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export Work Orders to Excel
router.get('/work-orders/excel', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query(`
            SELECT ot.*, a.nombre as activo_nombre, p.full_name as tecnico_nombre
            FROM msl.ordenes_trabajo ot
            LEFT JOIN msl.activos a ON ot.activo_id = a.id
            LEFT JOIN msl.profiles p ON ot.tecnico_asignado_id = p.id
            ORDER BY ot.created_at DESC
        `);
        const orders = result.recordset;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Ordenes de Trabajo');

        worksheet.columns = [
            { header: 'Código', key: 'codigo_ot', width: 15 },
            { header: 'Título', key: 'titulo', width: 30 },
            { header: 'Equipo', key: 'activo_nombre', width: 25 },
            { header: 'Prioridad', key: 'prioridad', width: 12 },
            { header: 'Estado', key: 'estado', width: 15 },
            { header: 'Técnico', key: 'tecnico_nombre', width: 25 },
            { header: 'Fecha Inicio', key: 'fecha_inicio', width: 20 },
            { header: 'Fecha Fin', key: 'fecha_fin', width: 20 },
        ];

        worksheet.addRows(orders);
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Reporte_OTs_ManSole.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Management Performance Report (KPIs)
router.get('/performance/pdf', async (req, res) => {
    try {
        const pool = await poolPromise;
        const kpiResult = await pool.query(`
            DECLARE @TotalTimeHours FLOAT;
            SET @TotalTimeHours = 720;
            WITH Stats AS (
                SELECT 
                    COUNT(*) as Failures,
                    SUM(DATEDIFF(MINUTE, fecha_inicio, fecha_fin)) / 60.0 as TotalRepairTime,
                    AVG(DATEDIFF(MINUTE, fecha_inicio, fecha_fin)) / 60.0 as MTTR
                FROM msl.ordenes_trabajo
                WHERE tipo = 'correctiva' AND estado = 'completada'
                  AND fecha_inicio IS NOT NULL AND fecha_fin IS NOT NULL
                  AND created_at >= DATEADD(day, -30, GETDATE())
            )
            SELECT 
                COALESCE(MTTR, 0) as MTTR,
                COALESCE((@TotalTimeHours - COALESCE(TotalRepairTime, 0)) / NULLIF(Failures, 0), @TotalTimeHours) as MTBF,
                COALESCE(Failures, 0) as TotalFailures,
                CASE WHEN COALESCE(Failures, 0) = 0 THEN 100.0 ELSE ((@TotalTimeHours - COALESCE(TotalRepairTime, 0)) / @TotalTimeHours) * 100.0 END as Availability
            FROM Stats
        `);
        const kpis = kpiResult.recordset[0];

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Reporte_Performance_ManSole.pdf');
        doc.pipe(res);

        doc.fontSize(22).text('REPORTE DE INDICADORES DE GESTIÓN', { align: 'center' });
        doc.fontSize(14).text('Periodo: Últimos 30 días', { align: 'center' });
        doc.moveDown(2);

        // KPI Box
        doc.rect(50, 150, 500, 150).stroke();
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Métrica', 70, 170);
        doc.text('Valor', 450, 170);
        doc.moveTo(70, 185).lineTo(530, 185).stroke();

        doc.font('Helvetica');
        doc.text('Disponibilidad Global', 70, 200);
        doc.text(`${kpis.Availability.toFixed(2)}%`, 450, 200);

        doc.text('Tiempo Medio entre Fallas (MTBF)', 70, 220);
        doc.text(`${kpis.MTBF.toFixed(1)} hrs`, 450, 220);

        doc.text('Tiempo Medio de Reparación (MTTR)', 70, 240);
        doc.text(`${kpis.MTTR.toFixed(1)} hrs`, 450, 240);

        doc.text('Total de Fallas Reportadas', 70, 260);
        doc.text(`${kpis.TotalFailures}`, 450, 260);

        doc.moveDown(5);
        doc.fontSize(10).fillColor('gray').text('Este reporte es generado automáticamente por el sistema ManSole CMMS.', { align: 'center' });

        doc.end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
