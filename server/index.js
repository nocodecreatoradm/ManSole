const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { poolPromise } = require('./db');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Basic check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const path = require('path');

// Import Routes
const authRoutes = require('./routes/auth');
const assetsRoutes = require('./routes/assets');
const plantsRoutes = require('./routes/plants');
const workRequestsRoutes = require('./routes/work-requests');
const workOrdersRoutes = require('./routes/work-orders');
const reportsRoutes = require('./routes/reports');
const analyticsRoutes = require('./routes/analytics');

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/plants', plantsRoutes);
app.use('/api/work-requests', workRequestsRoutes);
app.use('/api/work-orders', workOrdersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
