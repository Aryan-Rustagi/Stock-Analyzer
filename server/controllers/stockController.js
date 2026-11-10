const { searchStock, suggestStock, fetchHistoricalData } = require('../services/stockService');

async function getStock(req, res) {
    try {
        const { symbol } = req.params;
        if (!symbol || typeof symbol !== 'string' || !symbol.trim()) {
            return res.status(400).json({ message: 'Valid stock symbol is required' });
        }
        const stockData = await searchStock(symbol);
        return res.json(stockData);
    } catch(error) {
        console.warn('getStock error:', error.message);
        return res.status(404).json({ message: `Stock data not found for symbol "${req.params.symbol}"` });
    }
}

async function getSuggestions(req, res) {
    try {
        const query = req.query.q || '';
        const suggestions = await suggestStock(query);
        return res.json(suggestions);
    } catch(error) {
        console.warn('getSuggestions error:', error.message);
        return res.json([]);
    }
}

async function getHistoricalData(req, res) {
    try {
        const { symbol } = req.params;
        if (!symbol || typeof symbol !== 'string' || !symbol.trim()) {
            return res.status(400).json({ message: 'Valid stock symbol is required' });
        }
        const data = await fetchHistoricalData(symbol);
        return res.json(data);
    } catch(error) {
        console.warn('getHistoricalData error:', error.message);
        return res.status(404).json({ message: `Historical data not found for symbol "${req.params.symbol}"` });
    }
}

module.exports = { getStock, getSuggestions, getHistoricalData };
