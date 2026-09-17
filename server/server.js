const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const { validateEnvironment } = require('./config/validateEnv');
const connectDb = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const stockRoutes = require('./routes/stockRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Validate environment variables & masked secrets on server startup
validateEnvironment();

const app = express();
const PORT = process.env.PORT || 5000;
const clientBuildPath = process.env.CLIENT_BUILD_PATH || path.join(__dirname, '..', 'client', 'dist');
const indexHtmlPath = path.join(clientBuildPath, 'index.html');

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/ai', aiRoutes);

app.get('/health', function(req, res) {
    res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

if (process.env.NODE_ENV === 'production' && fs.existsSync(indexHtmlPath)) {
    app.use(express.static(clientBuildPath));

    app.get('{*splat}', function(req, res) {
        res.sendFile(indexHtmlPath);
    });
} else {
    app.get('/', function(req, res) {
        res.send("Welcome to the Stock Analyzer API");
    });
}

async function startServer() {
    await connectDb();
    app.listen(PORT, function() {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
}

startServer();