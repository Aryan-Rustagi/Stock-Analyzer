const { createInMemoryCache } = require('../utils/cache');

// In-Memory caches with optimal TTLs to keep data fast and fresh
const quoteCache = createInMemoryCache(2 * 60 * 1000);         // 2 minutes
const historicalCache = createInMemoryCache(15 * 60 * 1000);   // 15 minutes
const suggestCache = createInMemoryCache(5 * 60 * 1000);       // 5 minutes

const FETCH_TIMEOUT_MS = 4000; // 4s timeout for fast failover

// Instant in-memory index for sub-millisecond autocomplete
const POPULAR_STOCKS = [
    // Top Indian Stocks (NSE)
    { symbol: 'RELIANCE', shortname: 'Reliance Industries Ltd', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'TCS', shortname: 'Tata Consultancy Services', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'HDFCBANK', shortname: 'HDFC Bank Ltd', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'INFY', shortname: 'Infosys Ltd', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'ICICIBANK', shortname: 'ICICI Bank Ltd', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'BHARTIARTL', shortname: 'Bharti Airtel Ltd', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'SBIN', shortname: 'State Bank of India', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'ITC', shortname: 'ITC Ltd', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'LT', shortname: 'Larsen & Toubro Ltd', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'HINDUNILVR', shortname: 'Hindustan Unilever Ltd', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'TATAMOTORS', shortname: 'Tata Motors Ltd', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'BAJFINANCE', shortname: 'Bajaj Finance Ltd', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'MARUTI', shortname: 'Maruti Suzuki India Ltd', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'SUNPHARMA', shortname: 'Sun Pharmaceutical Industries', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'WIPRO', shortname: 'Wipro Ltd', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'AXISBANK', shortname: 'Axis Bank Ltd', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'KOTAKBANK', shortname: 'Kotak Mahindra Bank', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'TITAN', shortname: 'Titan Company Ltd', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'ASIANPAINT', shortname: 'Asian Paints Ltd', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'TATASTEEL', shortname: 'Tata Steel Ltd', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'ADANIENT', shortname: 'Adani Enterprises Ltd', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'ADANIPORTS', shortname: 'Adani Ports & SEZ', exchDisp: 'NSE', market: 'IN' },
    { symbol: 'COALINDIA', shortname: 'Coal India Ltd', exchDisp: 'NSE', market: 'IN' },

    // Top US Stocks (NASDAQ / NYSE)
    { symbol: 'AAPL', shortname: 'Apple Inc.', exchDisp: 'NASDAQ', market: 'US' },
    { symbol: 'MSFT', shortname: 'Microsoft Corporation', exchDisp: 'NASDAQ', market: 'US' },
    { symbol: 'NVDA', shortname: 'NVIDIA Corporation', exchDisp: 'NASDAQ', market: 'US' },
    { symbol: 'AMZN', shortname: 'Amazon.com Inc.', exchDisp: 'NASDAQ', market: 'US' },
    { symbol: 'GOOGL', shortname: 'Alphabet Inc.', exchDisp: 'NASDAQ', market: 'US' },
    { symbol: 'META', shortname: 'Meta Platforms Inc.', exchDisp: 'NASDAQ', market: 'US' },
    { symbol: 'TSLA', shortname: 'Tesla Inc.', exchDisp: 'NASDAQ', market: 'US' },
    { symbol: 'BRK.B', shortname: 'Berkshire Hathaway Inc.', exchDisp: 'NYSE', market: 'US' },
    { symbol: 'JPM', shortname: 'JPMorgan Chase & Co.', exchDisp: 'NYSE', market: 'US' },
    { symbol: 'V', shortname: 'Visa Inc.', exchDisp: 'NYSE', market: 'US' },
    { symbol: 'AMD', shortname: 'Advanced Micro Devices', exchDisp: 'NASDAQ', market: 'US' },
    { symbol: 'NFLX', shortname: 'Netflix Inc.', exchDisp: 'NASDAQ', market: 'US' },
    { symbol: 'DIS', shortname: 'The Walt Disney Company', exchDisp: 'NYSE', market: 'US' }
];

const KNOWN_INDIAN_SYMBOLS = new Set(POPULAR_STOCKS.filter(s => s.market === 'IN').map(s => s.symbol));
const KNOWN_US_SYMBOLS = new Set(POPULAR_STOCKS.filter(s => s.market === 'US').map(s => s.symbol));

async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
    return await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(timeoutMs)
    });
}

// ==================== INDIAN STOCK PROVIDERS ====================

async function searchStockIndianAPI(symbol) {
    const apiKey = process.env.INDIAN_API_KEY;
    if (!apiKey || apiKey.trim() === '') throw new Error("INDIAN_API_KEY_MISSING");

    const encodedSymbol = encodeURIComponent(symbol);
    const res = await fetchWithTimeout(`https://stock.indianapi.in/stock?name=${encodedSymbol}`, {
        headers: { 'x-api-key': apiKey }
    }, 3500);

    if (!res.ok) throw new Error("INDIAN_API_ERROR_" + res.status);
    const data = await res.json();

    const nsePrice = parseFloat(data.currentPrice?.NSE);
    const bsePrice = parseFloat(data.currentPrice?.BSE);
    const currentPrice = nsePrice || bsePrice;

    if (!currentPrice || isNaN(currentPrice) || currentPrice <= 0) {
        throw new Error("INDIAN_API_NO_PRICE");
    }

    const reusable = data.stockDetailsReusableData || {};
    const prevClose = parseFloat(reusable.close) || currentPrice;
    const openPrice = parseFloat(reusable.price) || currentPrice;
    const dayHigh = parseFloat(reusable.high) || parseFloat(data.yearHigh) || currentPrice;
    const dayLow = parseFloat(reusable.low) || parseFloat(data.yearLow) || currentPrice;

    return {
        symbol: symbol.toUpperCase(),
        companyName: data.companyName || symbol.toUpperCase(),
        currentPrice: currentPrice,
        currency: 'INR',
        exchange: nsePrice ? 'NSE' : 'BSE',
        marketState: 'ACTIVE',
        previousClose: prevClose,
        open: openPrice,
        high: dayHigh,
        low: dayLow,
        volume: 0
    };
}

async function searchStockTejHQ(symbol) {
    const apiKey = process.env.TEJ_API_KEY;
    if (!apiKey || apiKey.trim() === '') throw new Error("TEJ_KEY_MISSING");

    const encodedSymbol = encodeURIComponent(symbol);
    const res = await fetchWithTimeout(`https://api.tejhq.dev/v1/adjusted/nse/${encodedSymbol}`, {
        headers: { 'X-API-Key': apiKey }
    }, 3500);

    if (!res.ok) throw new Error("TEJ_ERROR_" + res.status);
    const data = await res.json();
    if (!data || !Array.isArray(data.data) || data.data.length === 0) {
        throw new Error("TEJ_NO_DATA");
    }

    const latest = data.data[data.data.length - 1];
    const prev = data.data.length > 1 ? data.data[data.data.length - 2] : latest;

    return {
        symbol: symbol.toUpperCase(),
        companyName: symbol.toUpperCase(),
        currentPrice: latest.close,
        currency: 'INR',
        exchange: 'NSE',
        marketState: 'ACTIVE',
        previousClose: latest.prev_close || prev.close,
        open: latest.open,
        high: latest.high,
        low: latest.low,
        volume: parseInt(latest.volume, 10) || 0
    };
}

// ==================== GLOBAL STOCK PROVIDERS ====================

// High-speed parallelized Finnhub query (Quote + Profile concurrently)
async function searchStockFinnhub(symbol) {
    const token = process.env.FINNHUB_API_KEY;
    if (!token || token.trim() === '') throw new Error("FINNHUB_KEY_MISSING");

    const encodedSymbol = encodeURIComponent(symbol);

    const [quoteRes, profileRes] = await Promise.all([
        fetchWithTimeout(`https://finnhub.io/api/v1/quote?symbol=${encodedSymbol}&token=${token}`, {}, 3000),
        fetchWithTimeout(`https://finnhub.io/api/v1/stock/profile2?symbol=${encodedSymbol}&token=${token}`, {}, 2500).catch(() => null)
    ]);

    if (!quoteRes.ok) throw new Error("FINNHUB_ERROR_" + quoteRes.status);
    const data = await quoteRes.json();
    if (!data || data.c === 0 || data.c === null) throw new Error("FINNHUB_NO_DATA");

    let companyName = symbol.toUpperCase();
    if (profileRes && profileRes.ok) {
        try {
            const profile = await profileRes.json();
            if (profile && profile.name) companyName = profile.name;
        } catch (_) {}
    }

    return {
        symbol: symbol.toUpperCase(),
        companyName: companyName,
        currentPrice: data.c,
        currency: 'USD',
        exchange: 'Unknown Exchange',
        marketState: 'ACTIVE',
        previousClose: data.pc,
        open: data.o,
        high: data.h,
        low: data.l,
        volume: parseInt(data.v, 10) || 0
    };
}

async function searchStockAlphaVantage(symbol) {
    const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!alphaVantageKey || alphaVantageKey.trim() === '') throw new Error("ALPHA_VANTAGE_KEY_MISSING");

    const encodedSymbol = encodeURIComponent(symbol);
    const res = await fetchWithTimeout(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodedSymbol}&apikey=${alphaVantageKey}`, {}, 3500);
    if (!res.ok) throw new Error("ALPHA_VANTAGE_ERROR_" + res.status);

    const data = await res.json();
    const quote = data['Global Quote'];
    if (!quote || !quote['05. price']) throw new Error("ALPHA_VANTAGE_NO_DATA");

    return {
        symbol: quote['01. symbol'] || symbol.toUpperCase(),
        companyName: symbol.toUpperCase(),
        currentPrice: parseFloat(quote['05. price']),
        currency: 'USD',
        exchange: 'Unknown Exchange',
        marketState: 'ACTIVE',
        previousClose: parseFloat(quote['08. previous close']) || 0,
        open: parseFloat(quote['02. open']) || 0,
        high: parseFloat(quote['03. high']) || 0,
        low: parseFloat(quote['04. low']) || 0,
        volume: parseInt(quote['06. volume'], 10) || 0
    };
}

async function searchStockTwelveData(symbol) {
    const twelveDataKey = process.env.TWELVE_DATA_API_KEY;
    if (!twelveDataKey || twelveDataKey.trim() === '') throw new Error("TWELVE_DATA_KEY_MISSING");

    const encodedSymbol = encodeURIComponent(symbol);
    const res = await fetchWithTimeout(`https://api.twelvedata.com/quote?symbol=${encodedSymbol}&apikey=${twelveDataKey}`, {}, 3500);
    if (!res.ok) throw new Error("TWELVE_DATA_ERROR_" + res.status);

    const data = await res.json();
    if (!data || data.status === 'error' || !data.close) throw new Error("TWELVE_DATA_NO_DATA");

    return {
        symbol: data.symbol || symbol.toUpperCase(),
        companyName: data.name || symbol.toUpperCase(),
        currentPrice: parseFloat(data.close),
        currency: data.currency || 'USD',
        exchange: data.exchange || 'Unknown Exchange',
        marketState: 'ACTIVE',
        previousClose: parseFloat(data.previous_close) || 0,
        open: parseFloat(data.open) || 0,
        high: parseFloat(data.high) || 0,
        low: parseFloat(data.low) || 0,
        volume: parseInt(data.volume, 10) || 0
    };
}

/**
 * Intelligent Fast-Routing Multi-Provider Stock Quote Search
 * Routes known markets instantly to cut 2-3 seconds of network round trips
 */
async function searchStock(symbol) {
    if (!symbol || typeof symbol !== 'string') {
        throw new Error("Invalid stock symbol");
    }
    const cleanSymbol = symbol.toUpperCase().trim();
    if (!cleanSymbol) {
        throw new Error("Empty stock symbol");
    }

    const baseSymbol = cleanSymbol.replace(/\.(NS|BO|BSE|NSE)$/i, '');

    // 1. Instant Cache Check (<1ms)
    const cached = quoteCache.get(cleanSymbol) || quoteCache.get(baseSymbol);
    if (cached) {
        return cached;
    }

    // 2. Fast Route Check: Known Indian Stock or Indian Suffix
    const isExplicitIndian = cleanSymbol.endsWith('.NS') || cleanSymbol.endsWith('.BO') || KNOWN_INDIAN_SYMBOLS.has(baseSymbol);
    const isExplicitUS = KNOWN_US_SYMBOLS.has(cleanSymbol);

    if (isExplicitIndian) {
        // Query Indian API directly
        try {
            const result = await searchStockIndianAPI(baseSymbol);
            quoteCache.set(baseSymbol, result);
            return quoteCache.set(cleanSymbol, result);
        } catch (_) {
            try {
                const result = await searchStockTejHQ(baseSymbol);
                quoteCache.set(baseSymbol, result);
                return quoteCache.set(cleanSymbol, result);
            } catch (err) {
                // fall through if not found
            }
        }
    } else if (isExplicitUS) {
        // Query Finnhub directly (0 hops wasted on Indian APIs)
        try {
            const result = await searchStockFinnhub(cleanSymbol);
            return quoteCache.set(cleanSymbol, result);
        } catch (_) {
            // fall through
        }
    }

    // 3. Fallback Route: Try Indian first, then Global
    if (process.env.INDIAN_API_KEY && !isExplicitUS) {
        try {
            const result = await searchStockIndianAPI(baseSymbol);
            quoteCache.set(baseSymbol, result);
            return quoteCache.set(cleanSymbol, result);
        } catch (_) {}
    }

    if (process.env.TEJ_API_KEY && !isExplicitUS) {
        try {
            const result = await searchStockTejHQ(baseSymbol);
            quoteCache.set(baseSymbol, result);
            return quoteCache.set(cleanSymbol, result);
        } catch (_) {}
    }

    try {
        const result = await searchStockFinnhub(cleanSymbol);
        return quoteCache.set(cleanSymbol, result);
    } catch (_) {
        try {
            const result = await searchStockAlphaVantage(cleanSymbol);
            return quoteCache.set(cleanSymbol, result);
        } catch (__) {
            try {
                const result = await searchStockTwelveData(cleanSymbol);
                return quoteCache.set(cleanSymbol, result);
            } catch (___) {
                throw new Error("Unable to fetch stock data for " + cleanSymbol);
            }
        }
    }
}

// ==================== SUGGEST STOCK (Search) ====================

async function suggestStockFinnhub(query) {
    const token = process.env.FINNHUB_API_KEY;
    if (!token || token.trim() === '') throw new Error("FINNHUB_KEY_MISSING");

    const encodedQuery = encodeURIComponent(query);
    const res = await fetchWithTimeout(`https://finnhub.io/api/v1/search?q=${encodedQuery}&token=${token}`, {}, 2500);
    if (!res.ok) throw new Error("FINNHUB_ERROR_" + res.status);

    const data = await res.json();
    if (!data || !data.result) return [];

    return data.result.slice(0, 4).map(q => ({
        symbol: q.symbol,
        shortname: q.description,
        exchDisp: q.type
    }));
}

/**
 * Ultra-Fast Autocomplete with In-Memory Matching (<1ms) + Fallback
 */
async function suggestStock(query) {
    if (!query || typeof query !== 'string' || !query.trim()) {
        return [];
    }
    const cleanQuery = query.trim().toUpperCase();

    // Check cache
    const cached = suggestCache.get(cleanQuery);
    if (cached) {
        return cached;
    }

    // Instant In-Memory Match (<1ms) from Popular Index
    const localMatches = POPULAR_STOCKS.filter(stock => 
        stock.symbol.startsWith(cleanQuery) || 
        stock.symbol.includes(cleanQuery) || 
        stock.shortname.toUpperCase().includes(cleanQuery)
    ).slice(0, 5);

    // If query is very short (1-2 chars), return local matches immediately for zero lag
    if (cleanQuery.length <= 2 && localMatches.length > 0) {
        return suggestCache.set(cleanQuery, localMatches);
    }

    let externalMatches = [];
    try {
        externalMatches = await suggestStockFinnhub(cleanQuery);
    } catch (_) {
        externalMatches = [];
    }

    const combined = [...localMatches, ...externalMatches];
    const seen = new Set();
    const unique = combined.filter(item => {
        if (seen.has(item.symbol)) return false;
        seen.add(item.symbol);
        return true;
    }).slice(0, 6);

    return suggestCache.set(cleanQuery, unique);
}

// ==================== HISTORICAL DATA ====================

async function fetchHistoricalTejHQ(symbol) {
    const apiKey = process.env.TEJ_API_KEY;
    if (!apiKey || apiKey.trim() === '') throw new Error("TEJ_KEY_MISSING");

    const encodedSymbol = encodeURIComponent(symbol);
    const res = await fetchWithTimeout(`https://api.tejhq.dev/v1/adjusted/nse/${encodedSymbol}`, {
        headers: { 'X-API-Key': apiKey }
    }, 4000);

    if (!res.ok) throw new Error("TEJ_HISTORICAL_ERROR_" + res.status);
    const data = await res.json();
    if (!data || !Array.isArray(data.data) || data.data.length === 0) {
        throw new Error("TEJ_NO_HISTORICAL");
    }

    return data.data.slice(-30).map(item => ({
        date: item.date,
        close: parseFloat(item.close)
    }));
}

async function fetchHistoricalFinnhub(symbol) {
    const token = process.env.FINNHUB_API_KEY;
    if (!token || token.trim() === '') throw new Error("FINNHUB_KEY_MISSING");

    const now = Math.floor(Date.now() / 1000);
    const from = now - (30 * 24 * 60 * 60);
    const encodedSymbol = encodeURIComponent(symbol);
    const res = await fetchWithTimeout(`https://finnhub.io/api/v1/stock/candle?symbol=${encodedSymbol}&resolution=D&from=${from}&to=${now}&token=${token}`, {}, 4000);
    if (!res.ok) throw new Error("FINNHUB_ERROR_" + res.status);

    const data = await res.json();
    if (!data || data.s !== 'ok' || !data.t || !data.c) throw new Error("FINNHUB_NO_HISTORICAL");

    const formatted = [];
    for (let i = 0; i < data.t.length; i++) {
        if (data.c[i] !== null && data.c[i] !== undefined) {
            formatted.push({
                date: new Date(data.t[i] * 1000).toISOString().split('T')[0],
                close: data.c[i]
            });
        }
    }
    return formatted;
}

async function fetchHistoricalAlphaVantage(symbol) {
    const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!alphaVantageKey || alphaVantageKey.trim() === '') throw new Error("ALPHA_VANTAGE_KEY_MISSING");

    const encodedSymbol = encodeURIComponent(symbol);
    const res = await fetchWithTimeout(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodedSymbol}&apikey=${alphaVantageKey}`, {}, 4000);
    if (!res.ok) throw new Error("ALPHA_VANTAGE_ERROR_" + res.status);

    const data = await res.json();
    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) throw new Error("ALPHA_VANTAGE_NO_HISTORICAL");

    const dates = Object.keys(timeSeries).sort();
    return dates.slice(-30).map(date => ({
        date: date,
        close: parseFloat(timeSeries[date]['4. close'])
    }));
}

/**
 * Fast-Routing Historical Data Fetcher with 15-Minute Cache
 */
async function fetchHistoricalData(symbol) {
    if (!symbol || typeof symbol !== 'string') {
        throw new Error("Invalid stock symbol");
    }
    const cleanSymbol = symbol.toUpperCase().trim();
    if (!cleanSymbol) {
        throw new Error("Empty stock symbol");
    }

    const baseSymbol = cleanSymbol.replace(/\.(NS|BO|BSE|NSE)$/i, '');

    const cached = historicalCache.get(cleanSymbol) || historicalCache.get(baseSymbol);
    if (cached) {
        return cached;
    }

    const isExplicitIndian = cleanSymbol.endsWith('.NS') || cleanSymbol.endsWith('.BO') || KNOWN_INDIAN_SYMBOLS.has(baseSymbol);
    const isExplicitUS = KNOWN_US_SYMBOLS.has(cleanSymbol);

    if (isExplicitIndian && process.env.TEJ_API_KEY) {
        try {
            const result = await fetchHistoricalTejHQ(baseSymbol);
            historicalCache.set(baseSymbol, result);
            return historicalCache.set(cleanSymbol, result);
        } catch (_) {}
    }

    if (isExplicitUS) {
        try {
            const result = await fetchHistoricalFinnhub(cleanSymbol);
            return historicalCache.set(cleanSymbol, result);
        } catch (_) {}
    }

    // Fallback: try TejHQ then Finnhub then Alpha Vantage
    if (process.env.TEJ_API_KEY) {
        try {
            const result = await fetchHistoricalTejHQ(baseSymbol);
            historicalCache.set(baseSymbol, result);
            return historicalCache.set(cleanSymbol, result);
        } catch (_) {}
    }

    try {
        const result = await fetchHistoricalFinnhub(cleanSymbol);
        return historicalCache.set(cleanSymbol, result);
    } catch (error) {
        try {
            const result = await fetchHistoricalAlphaVantage(cleanSymbol);
            return historicalCache.set(cleanSymbol, result);
        } catch (fallbackError) {
            throw new Error("Unable to fetch historical data for " + cleanSymbol);
        }
    }
}

module.exports = { searchStock, suggestStock, fetchHistoricalData };
