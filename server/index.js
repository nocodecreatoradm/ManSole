const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize express app
const app = express();
const port = process.env.PORT || 4000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Path for static files
// We use path.resolve to get an absolute path regardless of where the script is run from
const distPath = path.resolve(process.cwd(), 'dist');
console.log('Production: Serving static files from', distPath);

// Serve static files BEFORE routes
app.use(express.static(distPath));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database connection
const { poolPromise } = require('./db');

// Import Routes
const authRoutes = require('./routes/auth');
const assetsRoutes = require('./routes/assets');
const plantsRoutes = require('./routes/plants');
const workRequestsRoutes = require('./routes/work-requests');
const workOrdersRoutes = require('./routes/work-orders');
const reportsRoutes = require('./routes/reports');
const analyticsRoutes = require('./routes/analytics');
const preventiveRoutes = require('./routes/preventive');
const inventoryRoutes = require('./routes/inventory');

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/plants', plantsRoutes);
app.use('/api/work-requests', workRequestsRoutes);
app.use('/api/work-orders', workOrdersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/preventive', preventiveRoutes);
app.use('/api/inventory', inventoryRoutes);

// SPA Catchall - must be AFTER all other routes
app.get(/.*/, (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error sending index.html:', err);
            res.status(500).send(err.message);
        }
    });
});

// Global Error Handling
app.use((err, req, res, next) => {
    console.error('GLOBAL ERROR:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

const { setupCronTasks } = require('./services/preventiveTask');

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    // Start automation tasks
    setupCronTasks();
});
