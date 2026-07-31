const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const connectDb = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const stockRoutes = require('./routes/stockRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const clientBuildPath = process.env.CLIENT_BUILD_PATH || path.join(__dirname, '..', 'client', 'dist');

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/portfolio', portfolioRoutes);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(clientBuildPath));

    app.get('{*splat}', function(req, res) {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
} else {
    app.get('/', function(req, res) {
        res.send("Welcome to the stock analyzer - v1.0.3");
    });
}

async function startServer() {
    await connectDb();
    app.listen(PORT, function() {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

startServer();