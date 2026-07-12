const { searchStock, suggestStock, fetchHistoricalData } = require('../services/stockService');

async function getStock(req, res) {
    try {
        const symbol = req.params.symbol;
        const stockData = await searchStock(symbol);
        res.json(stockData);
    } catch(error) {
        res.status(500).json({ message: error.message });
    }
}

async function getSuggestions(req, res) {
    try {
        const query = req.query.q;
        const suggestions = await suggestStock(query);
        res.json(suggestions);
    } catch(error) {
        res.status(500).json({ message: error.message });
    }
}

async function getHistoricalData(req, res) {
    try {
        const symbol = req.params.symbol;
        const data = await fetchHistoricalData(symbol);
        res.json(data);
    } catch(error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = { getStock, getSuggestions, getHistoricalData };