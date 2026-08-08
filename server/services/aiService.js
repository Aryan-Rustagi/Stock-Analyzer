const Groq = require('groq-sdk');

// Structured output schema that the LLM must conform to (prompt engineering via schema definition)
var ANALYSIS_SCHEMA = {
    sentiment: 'one of: Bullish | Neutral | Bearish',
    summary: 'A 2-3 sentence plain-English analysis of the stock',
    strengths: 'array of exactly 2 short strength point strings',
    risks: 'array of exactly 2 short risk point strings',
    recommendation: 'one of: Buy | Hold | Sell'
};

// System prompt template — defines the AI role, output format rules, and JSON schema (prompt engineering)
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

// Dynamic user prompt — constructed at runtime from real stock data (prompt engineering)
function buildUserPrompt(stockData) {
    var changePercent = '0.00';
    if (stockData.previousClose && stockData.previousClose !== 0) {
        changePercent = ((stockData.currentPrice - stockData.previousClose) / stockData.previousClose * 100).toFixed(2);
    }

    return [
        'Analyze this stock and return ONLY a JSON object matching the required schema:',
        '',
        'Symbol: ' + stockData.symbol,
        'Company: ' + (stockData.companyName || stockData.symbol),
        'Current Price: $' + stockData.currentPrice,
        'Previous Close: $' + stockData.previousClose,
        'Day Change: ' + changePercent + '%',
        'Open: $' + stockData.open,
        'Day High: $' + stockData.high,
        'Day Low: $' + stockData.low,
        'Volume: ' + stockData.volume
    ].join('\n');
}

// Parse and validate the structured JSON output from the LLM
function parseStructuredOutput(rawText) {
    var cleaned = rawText.trim();

    // Strip any accidental markdown code fences
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    var parsed;
    try {
        parsed = JSON.parse(cleaned);
    } catch (e) {
        throw new Error('LLM returned invalid JSON: ' + rawText.slice(0, 200));
    }

    // Validate and normalise required fields
    var validSentiments = ['Bullish', 'Neutral', 'Bearish'];
    var validRecommendations = ['Buy', 'Hold', 'Sell'];

    if (!validSentiments.includes(parsed.sentiment)) { parsed.sentiment = 'Neutral'; }
    if (!validRecommendations.includes(parsed.recommendation)) { parsed.recommendation = 'Hold'; }
    if (!Array.isArray(parsed.strengths)) { parsed.strengths = []; }
    if (!Array.isArray(parsed.risks)) { parsed.risks = []; }
    if (typeof parsed.summary !== 'string') { parsed.summary = ''; }

    return parsed;
}

async function analyzeStockWithAI(stockData) {
    var client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    var systemPrompt = buildSystemPrompt();
    var userPrompt = buildUserPrompt(stockData);

    // LLM API call using Groq's chat completions with system + user message structure
    var completion = await client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,      // Low temperature for deterministic, factual structured output
        max_tokens: 512,
        response_format: { type: 'json_object' }  // Enforce JSON-only response (structured output)
    });

    var rawText = completion.choices[0].message.content;

    // Parse and validate the structured JSON output
    return parseStructuredOutput(rawText);
}

// ==================== FINANCE CHAT ====================

// System prompt for the chat feature — defines role and structured JSON output schema
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
    var client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Chat uses the lightest available model for speed
    var completion = await client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
            { role: 'system', content: buildChatSystemPrompt() },
            { role: 'user', content: question }
        ],
        temperature: 0.4,
        max_tokens: 300,
        response_format: { type: 'json_object' }
    });

    var rawText = completion.choices[0].message.content;
    var cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    var parsed;
    try {
        parsed = JSON.parse(cleaned);
    } catch (e) {
        // Fallback if model returns plain text instead of JSON
        parsed = { answer: rawText, disclaimer: '' };
    }

    return {
        answer: parsed.answer || rawText,
        disclaimer: parsed.disclaimer || ''
    };
}

module.exports = { analyzeStockWithAI, chatWithAI };
