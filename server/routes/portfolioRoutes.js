const express = require('express');
const router = express.Router();
const { getPortfolio, addStock, removeStock } = require('../controllers/portfolioController');

router.get('/', getPortfolio);
router.post('/add', addStock);
router.delete('/:id', removeStock);

module.exports = router;