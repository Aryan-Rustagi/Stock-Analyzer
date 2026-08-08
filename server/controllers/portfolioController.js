const Portfolio = require('../models/Portfolio');
const { searchStock } = require('../services/stockService');

// Helper demonstrating Promise constructor wrapping callback-style async operation (Promise vs Callback)
function fetchStockWithPromise(symbol) {
    return new Promise(function(resolve, reject) {
        searchStock(symbol)
            .then(function(data) {
                resolve(data);
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

// Express route callback handler using (req, res, next) with async/await and Promise.all
async function getPortfolio(req, res, next) {
    try {
        // Relational data JOIN between Portfolio and User collections
        const stocks = await Portfolio.find({ user: req.user._id }).populate('user', 'name email');
        
        // Parallel async resolution using Promise.all with async/await inside mapped function
        const portfolioWithPrices = await Promise.all(stocks.map(async function(stock) {
            try {
                const stockData = await fetchStockWithPromise(stock.symbol);
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
        if (typeof next === 'function') {
            return next(error);
        }
        res.status(500).json({ message: 'Failed to fetch portfolio' });
    }
}

async function addStock(req, res, next) {
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
        if (typeof next === 'function') {
            return next(error);
        }
        res.status(500).json({ message: 'Failed to add stock' });
    }
}

async function removeStock(req, res, next) {
    try {
        await Portfolio.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        res.json({ message: 'Stock removed' });
    } catch(error) {
        console.error('removeStock error:', error);
        if (typeof next === 'function') {
            return next(error);
        }
        res.status(500).json({ message: 'Failed to remove stock' });
    }
}

module.exports = { getPortfolio, addStock, removeStock };