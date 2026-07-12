const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const connectDb = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const stockRoutes = require('./routes/stockRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/portfolio', portfolioRoutes);

app.get('/', function(req, res) {
    res.send("Welcome to the stock analyzer - v1.0.3");
});

async function startServer() {
    await connectDb();
    app.listen(PORT, function() {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

startServer();