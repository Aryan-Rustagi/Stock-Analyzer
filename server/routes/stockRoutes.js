const express = require('express');
const router = express.Router();
const { getStock, getSuggestions, getHistoricalData } = require('../controllers/stockController');

router.get('/suggestions/search', getSuggestions);
router.get('/:symbol/history', getHistoricalData);
router.get('/:symbol', getStock);

module.exports = router;