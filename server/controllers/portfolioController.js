const Portfolio = require('../models/Portfolio');
const jwt = require('jsonwebtoken');
const { searchStock } = require('../services/stockService');

async function getPortfolio(req, res) {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const stocks = await Portfolio.find({ user: decoded.id });
        
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
        res.status(500).json({ message: 'Failed to fetch portfolio' });
    }
}

async function addStock(req, res) {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { symbol } = req.body;

        const existing = await Portfolio.findOne({ user: decoded.id, symbol: symbol });
        if (existing) {
            return res.status(400).json({ message: 'Stock already added' });
        }

        const newStock = await Portfolio.create({
            user: decoded.id,
            symbol: symbol
        });

        res.status(201).json(newStock);
    } catch(error) {
        res.status(500).json({ message: 'Failed to add stock' });
    }
}

async function removeStock(req, res) {
    try {
        await Portfolio.findByIdAndDelete(req.params.id);
        res.json({ message: 'Stock removed' });
    } catch(error) {
        res.status(500).json({ message: 'Failed to remove stock' });
    }
}

module.exports = { getPortfolio, addStock, removeStock };