const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getAIAnalysis, getAIChat } = require('../controllers/aiController');

// Protected route: GET /api/ai/analyze/:symbol — Stock analysis with structured output
router.get('/analyze/:symbol', protect, getAIAnalysis);

// Protected route: POST /api/ai/chat — Lightweight finance Q&A chat
router.post('/chat', protect, getAIChat);

module.exports = router;
