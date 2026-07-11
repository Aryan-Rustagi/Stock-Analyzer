const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDb = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const stockRoutes = require('./routes/stockRoutes');


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/stock',stockRoutes);

app.get('/', function(req, res) {
    res.send("Welcome to the stock analyzer");
});

async function startServer() {
    await connectDb();
    app.listen(PORT, function() {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

startServer();