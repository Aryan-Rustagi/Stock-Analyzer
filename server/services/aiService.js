const Groq = require('groq-sdk');
const { createInMemoryCache } = require('../utils/cache');

const DEFAULT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

// Fast in-memory caches for AI outputs (avoids repeating slow LLM calls)
const aiAnalysisCache = createInMemoryCache(15 * 60 * 1000); // 15 minutes
const aiChatCache = createInMemoryCache(30 * 60 * 1000);     // 30 minutes

let groqClient = null;
function getGroqClient() {
    if (!groqClient) {
        if (!process.env.GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY is not configured in environment variables');
        }
        groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groqClient;
}

// Structured output schema that the LLM must conform to (prompt engineering via schema definition)
const ANALYSIS_SCHEMA = {
    sentiment: 'one of: Bullish | Neutral | Bearish',
    summary: 'A 2-3 sentence plain-English analysis of the stock',
    strengths: 'array of exactly 2 short strength point strings',
    risks: 'array of exactly 2 short risk point strings',
    recommendation: 'one of: Buy | Hold | Sell'
};

function buildSystemPrompt() {
    return [
        'You are a professional stock market analyst AI assistant.',
        'Your role is to analyze stock market data provided by the user and return a structured JSON response.',
        'You must ALWAYS respond with a single valid JSON object and NOTHING ELSE — no markdown code fences, no extra text, no explanation.',
        'Your JSON response must strictly follow this schema:',
        JSON.stringify(ANALYSIS_SCHEMA, null, 2),
        '',
        'Rules:',
        '- sentiment must be exactly one of: Bullish, Neutral, Bearish',
        '- recommendation must be exactly one of: Buy, Hold, Sell',
        '- strengths must be a JSON array of exactly 2 short strings',
        '- risks must be a JSON array of exactly 2 short strings',
        '- summary must be 2-3 sentences maximum',
        '- Output ONLY the JSON object, nothing else'
    ].join('\n');
}

function buildUserPrompt(stockData) {
    let changePercent = '0.00';
    if (stockData.previousClose && stockData.previousClose !== 0) {
        changePercent = ((stockData.currentPrice - stockData.previousClose) / stockData.previousClose * 100).toFixed(2);
    }
    const currency = stockData.currency || 'USD';

    return [
        'Analyze this stock and return ONLY a JSON object matching the required schema:',
        '',
        'Symbol: ' + stockData.symbol,
        'Company: ' + (stockData.companyName || stockData.symbol),
        'Exchange: ' + (stockData.exchange || 'Market'),
        'Current Price: ' + currency + ' ' + stockData.currentPrice,
        'Previous Close: ' + currency + ' ' + stockData.previousClose,
        'Day Change: ' + changePercent + '%',
        'Open: ' + currency + ' ' + stockData.open,
        'Day High: ' + currency + ' ' + stockData.high,
        'Day Low: ' + currency + ' ' + stockData.low,
        'Volume: ' + stockData.volume
    ].join('\n');
}

function parseStructuredOutput(rawText) {
    let cleaned = rawText.trim();

    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed;
    try {
        parsed = JSON.parse(cleaned);
    } catch (e) {
        throw new Error('LLM returned invalid JSON: ' + rawText.slice(0, 200));
    }

    const validSentiments = ['Bullish', 'Neutral', 'Bearish'];
    const validRecommendations = ['Buy', 'Hold', 'Sell'];

    const matchedSentiment = validSentiments.find(s => s.toLowerCase() === String(parsed.sentiment).toLowerCase());
    parsed.sentiment = matchedSentiment || 'Neutral';

    const matchedRec = validRecommendations.find(r => r.toLowerCase() === String(parsed.recommendation).toLowerCase());
    parsed.recommendation = matchedRec || 'Hold';

    if (!Array.isArray(parsed.strengths)) { parsed.strengths = []; }
    if (!Array.isArray(parsed.risks)) { parsed.risks = []; }
    if (typeof parsed.summary !== 'string') { parsed.summary = ''; }

    return parsed;
}

async function analyzeStockWithAI(stockData) {
    const cacheKey = stockData.symbol.toUpperCase() + '_' + stockData.currentPrice;
    const cached = aiAnalysisCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const client = getGroqClient();

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(stockData);

    const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
    });

    const rawText = completion.choices[0].message.content;
    const parsed = parseStructuredOutput(rawText);

    return aiAnalysisCache.set(cacheKey, parsed);
}

// ==================== FINANCE CHAT ====================

function buildChatSystemPrompt() {
    return [
        'You are a helpful and knowledgeable AI finance assistant for a stock market application.',
        'A user will ask a finance, investing, or stock market related question.',
        'You must respond with ONLY a valid JSON object — no markdown, no code fences, no extra text.',
        'Your response must follow this exact schema:',
        JSON.stringify({ answer: 'A clear, concise answer to the question (2-4 sentences max)', disclaimer: 'A 1-sentence disclaimer if appropriate, or an empty string' }, null, 2),
        '',
        'Rules:',
        '- answer must be clear, beginner-friendly, and factually accurate',
        '- If the question is not related to finance or stocks, politely redirect the user',
        '- disclaimer should note this is not financial advice when relevant, otherwise empty string',
        '- Output ONLY the JSON object'
    ].join('\n');
}

async function chatWithAI(question) {
    const cleanQuestion = question.trim().toLowerCase();
    const cached = aiChatCache.get(cleanQuestion);
    if (cached) {
        return cached;
    }

    const client = getGroqClient();

    const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
            { role: 'system', content: buildChatSystemPrompt() },
            { role: 'user', content: question }
        ],
        temperature: 0.4,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
    });

    const rawText = completion.choices[0].message.content;
    const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed;
    try {
        parsed = JSON.parse(cleaned);
    } catch (e) {
        parsed = { answer: rawText, disclaimer: '' };
    }

    const result = {
        answer: parsed.answer || rawText,
        disclaimer: parsed.disclaimer || ''
    };

    return aiChatCache.set(cleanQuestion, result);
}

module.exports = { analyzeStockWithAI, chatWithAI };
