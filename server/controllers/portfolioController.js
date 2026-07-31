const Portfolio = require('../models/Portfolio');
const { searchStock } = require('../services/stockService');

async function getPortfolio(req, res) {
    try {
        const stocks = await Portfolio.find({ user: req.user._id });
        
        const portfolioWithPrices = await Promise.all(stocks.map(async function(stock) {
            try {
                const stockData = await searchStock(stock.symbol);
                return {
                    ...stock.toObject(),
                    price: stockData.currentPrice
                };
            } catch (err) {
                return stock.toObject();
            }
        }));

        res.json(portfolioWithPrices);
    } catch(error) {
        console.error('getPortfolio error:', error);
        res.status(500).json({ message: 'Failed to fetch portfolio' });
    }
}

async function addStock(req, res) {
    try {
        const { symbol } = req.body;

        const existing = await Portfolio.findOne({ user: req.user._id, symbol: symbol.toUpperCase() });
        if (existing) {
            return res.status(400).json({ message: 'Stock already added' });
        }

        const newStock = await Portfolio.create({
            user: req.user._id,
            symbol: symbol.toUpperCase()
        });

        res.status(201).json(newStock);
    } catch(error) {
        console.error('addStock error:', error);
        res.status(500).json({ message: 'Failed to add stock' });
    }
}

async function removeStock(req, res) {
    try {
        await Portfolio.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        res.json({ message: 'Stock removed' });
    } catch(error) {
        console.error('removeStock error:', error);
        res.status(500).json({ message: 'Failed to remove stock' });
    }
}

module.exports = { getPortfolio, addStock, removeStock };