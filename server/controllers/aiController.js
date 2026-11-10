const { searchStock } = require('../services/stockService');
const { analyzeStockWithAI, chatWithAI } = require('../services/aiService');

// Express route handler — fetches live stock data, then sends it to the LLM for AI analysis
async function getAIAnalysis(req, res, next) {
    try {
        const symbol = req.params.symbol;

        if (!symbol || typeof symbol !== 'string' || !symbol.trim()) {
            return res.status(400).json({ message: 'Stock symbol is required' });
        }

        // Step 1: Fetch real-time stock data
        const stockData = await searchStock(symbol.trim().toUpperCase());

        // Step 2: Send to Groq LLM with engineered prompts for structured analysis
        const analysis = await analyzeStockWithAI(stockData);

        // Step 3: Return structured JSON result to client
        return res.status(200).json({
            symbol: stockData.symbol,
            companyName: stockData.companyName,
            currentPrice: stockData.currentPrice,
            analysis: analysis
        });
    } catch (error) {
        console.error('AI analysis error:', error.message);
        if (typeof next === 'function') {
            return next(error);
        }
        return res.status(500).json({ message: 'AI analysis failed: ' + error.message });
    }
}

// Express route handler for lightweight finance chat Q&A
async function getAIChat(req, res, next) {
    try {
        const question = req.body.question;

        if (!question || typeof question !== 'string' || !question.trim()) {
            return res.status(400).json({ message: 'Question is required' });
        }

        // Send question to Groq LLM and get structured JSON response
        const result = await chatWithAI(question.trim());

        return res.status(200).json(result);
    } catch (error) {
        console.error('AI chat error:', error.message);
        if (typeof next === 'function') {
            return next(error);
        }
        return res.status(500).json({ message: 'AI chat failed: ' + error.message });
    }
}

module.exports = { getAIAnalysis, getAIChat };
