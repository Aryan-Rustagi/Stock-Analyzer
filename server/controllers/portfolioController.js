const mongoose = require('mongoose');
const Portfolio = require('../models/Portfolio');
const { searchStock } = require('../services/stockService');

async function getPortfolio(req, res, next) {
    try {
        const stocks = await Portfolio.find({ user: req.user._id }).sort({ createdAt: -1 });
        
        const portfolioWithPrices = await Promise.all(stocks.map(async function(stock) {
            try {
                const stockData = await searchStock(stock.symbol);
                return {
                    ...stock.toObject(),
                    price: stockData.currentPrice,
                    currency: stockData.currency || 'USD'
                };
            } catch {
                return stock.toObject();
            }
        }));

        return res.json(portfolioWithPrices);
    } catch(error) {
        console.error('getPortfolio error:', error);
        if (typeof next === 'function') {
            return next(error);
        }
        return res.status(500).json({ message: 'Failed to fetch portfolio' });
    }
}

async function addStock(req, res, next) {
    try {
        const { symbol } = req.body;

        if (!symbol || typeof symbol !== 'string' || !symbol.trim()) {
            return res.status(400).json({ message: 'A valid stock symbol is required' });
        }

        const cleanSymbol = symbol.trim().toUpperCase();

        const existing = await Portfolio.findOne({ user: req.user._id, symbol: cleanSymbol });
        if (existing) {
            return res.status(400).json({ message: 'Stock already in portfolio' });
        }

        const newStock = await Portfolio.create({
            user: req.user._id,
            symbol: cleanSymbol
        });

        return res.status(201).json(newStock);
    } catch(error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Stock already in portfolio' });
        }
        console.error('addStock error:', error);
        if (typeof next === 'function') {
            return next(error);
        }
        return res.status(500).json({ message: 'Failed to add stock' });
    }
}

async function removeStock(req, res, next) {
    try {
        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid portfolio item ID' });
        }

        const deleted = await Portfolio.findOneAndDelete({ _id: id, user: req.user._id });
        if (!deleted) {
            return res.status(404).json({ message: 'Stock not found in portfolio' });
        }

        return res.json({ message: 'Stock removed', id });
    } catch(error) {
        console.error('removeStock error:', error);
        if (typeof next === 'function') {
            return next(error);
        }
        return res.status(500).json({ message: 'Failed to remove stock' });
    }
}

module.exports = { getPortfolio, addStock, removeStock };
