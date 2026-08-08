const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const connectDb = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const stockRoutes = require('./routes/stockRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const aiRoutes = require('./routes/aiRoutes');

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
        msg: "ok"
    });
});

if (process.env.NODE_ENV === 'production' && fs.existsSync(indexHtmlPath)) {
    app.use(express.static(clientBuildPath));

    app.get('{*splat}', function(req, res) {
        res.sendFile(indexHtmlPath);
    });
} else {
    app.get('/', function(req, res) {
        res.send("Welcome to the stock analyzer - v1.0.3");
    });
}


// Demonstrating JavaScript Hoisting:
// 1. Function Declarations (`function startServer()`) are hoisted to the top of the scope, allowing them to be called before definition.
// 2. Variable/Expression Declarations (`const app`, `const protect = ...`) stay in Temporal Dead Zone (TDZ) and are NOT hoisted.

startServer(); // Invoked before definition thanks to function declaration hoisting

// =========================================================================
// Demonstrating JavaScript Event Loop (Microtasks vs Macrotasks)
// =========================================================================
console.log('Event Loop Demo: 1. Synchronous script execution');

setTimeout(function() {
    // This is a Macrotask. It is pushed to the Timers phase of the Event Loop 
    // and runs AFTER all synchronous code and all Microtasks have finished.
    console.log('Event Loop Demo: 4. setTimeout (Macrotask)');
}, 0);

Promise.resolve().then(function() {
    // This is a Microtask. It is pushed to the Microtask queue and runs 
    // immediately after the synchronous execution phase, BEFORE Macrotasks.
    console.log('Event Loop Demo: 3. Promise resolved (Microtask)');
});

console.log('Event Loop Demo: 2. Synchronous script execution ended');
// =========================================================================

async function startServer() {
    await connectDb();
    app.listen(PORT, function() {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}