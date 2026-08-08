const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getPortfolio, addStock, removeStock } = require('../controllers/portfolioController');

router.get('/', protect, getPortfolio);
router.post('/add', protect, addStock);
router.delete('/:id', protect, removeStock);

module.exports = router;