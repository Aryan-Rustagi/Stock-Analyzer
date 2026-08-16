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
        res.send("Welcome to the Stock Analyzer API - v1.0.3");
    });
}

// =========================================================================
// Demonstrating JavaScript Hoisting:
// 1. Function Declarations (`function startServer()`) are fully hoisted, allowing invocation before definition.
// 2. Variable/Expression Declarations (`const app`, `const PORT`) stay in Temporal Dead Zone (TDZ).
// =========================================================================
startServer(); // Invoked before definition thanks to function declaration hoisting

// =========================================================================
// Demonstrating JavaScript Event Loop (Microtasks vs Macrotasks)
// Order of execution:
// 1. Synchronous Execution Phase
// 2. Microtask Queue (Promises / process.nextTick)
// 3. Macrotask Queue (setTimeout / setInterval / I/O)
// =========================================================================
console.log('Event Loop Demo: 1. Synchronous script execution');

setTimeout(function() {
    // Macrotask: pushed to Timers phase, runs AFTER microtasks finish
    console.log('Event Loop Demo: 4. setTimeout (Macrotask)');
}, 0);

Promise.resolve().then(function() {
    // Microtask: pushed to Microtask queue, runs immediately after synchronous phase
    console.log('Event Loop Demo: 3. Promise resolved (Microtask)');
});

console.log('Event Loop Demo: 2. Synchronous script execution ended');

async function startServer() {
    await connectDb();
    app.listen(PORT, function() {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
}