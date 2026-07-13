const token = process.env.FINNHUB_API_KEY;
const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
const twelveDataKey = process.env.TWELVE_DATA_API_KEY;

// ==================== SEARCH STOCK (Quote/Price) ====================

async function searchStockFinnhub(symbol) {
    const res = await fetch('https://finnhub.io/api/v1/quote?symbol=' + symbol + '&token=' + token);
    if (!res.ok) throw new Error("FINNHUB_ERROR_" + res.status);
    var data;
    try { data = await res.json(); } catch (e) { throw new Error("FINNHUB_INVALID_JSON"); }
    if (!data || data.c === 0) throw new Error("FINNHUB_NO_DATA");

    // Get company name from profile
    var companyName = symbol.toUpperCase();
    try {
        const profileRes = await fetch('https://finnhub.io/api/v1/stock/profile2?symbol=' + symbol + '&token=' + token);
        if (profileRes.ok) {
            const profile = await profileRes.json();
            if (profile && profile.name) companyName = profile.name;
        }
    } catch (e) { /* ignore profile errors */ }

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
        volume: 0
    };
}

async function searchStockAlphaVantage(symbol) {
    const res = await fetch('https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=' + symbol + '&apikey=' + alphaVantageKey);
    if (!res.ok) throw new Error("ALPHA_VANTAGE_ERROR_" + res.status);
    var data;
    try { data = await res.json(); } catch (e) { throw new Error("ALPHA_VANTAGE_INVALID_JSON"); }
    var quote = data['Global Quote'];
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
        volume: parseInt(quote['06. volume']) || 0
    };
}

async function searchStockTwelveData(symbol) {
    const res = await fetch('https://api.twelvedata.com/quote?symbol=' + symbol + '&apikey=' + twelveDataKey);
    if (!res.ok) throw new Error("TWELVE_DATA_ERROR_" + res.status);
    var data;
    try { data = await res.json(); } catch (e) { throw new Error("TWELVE_DATA_INVALID_JSON"); }
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
        volume: parseInt(data.volume) || 0
    };
}

async function searchStock(symbol) {
    try {
        return await searchStockFinnhub(symbol);
    } catch (error) {
        console.log('Finnhub quote failed (' + error.message + '), trying Alpha Vantage');
        try {
            return await searchStockAlphaVantage(symbol);
        } catch (fallbackError) {
            console.log('Alpha Vantage quote failed (' + fallbackError.message + '), trying Twelve Data');
            try {
                return await searchStockTwelveData(symbol);
            } catch (twelveError) {
                throw new Error("Unable to fetch stock data from any provider.");
            }
        }
    }
}

// ==================== SUGGEST STOCK (Search) ====================

async function suggestStockFinnhub(query) {
    const res = await fetch('https://finnhub.io/api/v1/search?q=' + query + '&token=' + token);
    if (!res.ok) throw new Error("FINNHUB_ERROR_" + res.status);
    var data;
    try { data = await res.json(); } catch (e) { throw new Error("FINNHUB_INVALID_JSON"); }
    if (!data || !data.result) throw new Error("FINNHUB_NO_RESULTS");
    return data.result.slice(0, 5).map(function(q) {
        return { symbol: q.symbol, shortname: q.description, exchDisp: q.type };
    });
}

async function suggestStockAlphaVantage(query) {
    const res = await fetch('https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=' + query + '&apikey=' + alphaVantageKey);
    if (!res.ok) throw new Error("ALPHA_VANTAGE_ERROR_" + res.status);
    var data;
    try { data = await res.json(); } catch (e) { throw new Error("ALPHA_VANTAGE_INVALID_JSON"); }
    if (!data || !data.bestMatches) throw new Error("ALPHA_VANTAGE_NO_RESULTS");
    return data.bestMatches.slice(0, 5).map(function(match) {
        return { symbol: match['1. symbol'], shortname: match['2. name'], exchDisp: match['4. region'] };
    });
}

async function suggestStockTwelveData(query) {
    const res = await fetch('https://api.twelvedata.com/symbol_search?symbol=' + query + '&outputsize=5');
    if (!res.ok) throw new Error("TWELVE_DATA_ERROR_" + res.status);
    var data;
    try { data = await res.json(); } catch (e) { throw new Error("TWELVE_DATA_INVALID_JSON"); }
    if (!data || !data.data || data.data.length === 0) return [];
    return data.data.slice(0, 5).map(function(item) {
        return { symbol: item.symbol, shortname: item.instrument_name, exchDisp: item.exchange };
    });
}

async function suggestStock(query) {
    try {
        return await suggestStockFinnhub(query);
    } catch (error) {
        console.log('Finnhub search failed, falling back to Alpha Vantage');
        try {
            return await suggestStockAlphaVantage(query);
        } catch (fallbackError) {
            console.log('Alpha Vantage search failed, falling back to Twelve Data');
            try {
                return await suggestStockTwelveData(query);
            } catch (twelveError) {
                throw new Error("Unable to fetch stock suggestions from any provider.");
            }
        }
    }
}

// ==================== HISTORICAL DATA ====================

async function fetchHistoricalFinnhub(symbol) {
    var now = Math.floor(Date.now() / 1000);
    var from = now - (30 * 24 * 60 * 60); // 30 days ago
    const res = await fetch('https://finnhub.io/api/v1/stock/candle?symbol=' + symbol + '&resolution=D&from=' + from + '&to=' + now + '&token=' + token);
    if (!res.ok) throw new Error("FINNHUB_ERROR_" + res.status);
    var data;
    try { data = await res.json(); } catch (e) { throw new Error("FINNHUB_INVALID_JSON"); }
    if (!data || data.s !== 'ok' || !data.t || !data.c) throw new Error("FINNHUB_NO_HISTORICAL");

    var formatted = [];
    for (var i = 0; i < data.t.length; i++) {
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
    const res = await fetch('https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=' + symbol + '&apikey=' + alphaVantageKey);
    if (!res.ok) throw new Error("ALPHA_VANTAGE_ERROR_" + res.status);
    var data;
    try { data = await res.json(); } catch (e) { throw new Error("ALPHA_VANTAGE_INVALID_JSON"); }
    var timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) throw new Error("ALPHA_VANTAGE_NO_HISTORICAL");

    var dates = Object.keys(timeSeries).sort();
    var recent = dates.slice(-30);
    return recent.map(function(date) {
        return {
            date: date,
            close: parseFloat(timeSeries[date]['4. close'])
        };
    });
}

async function fetchHistoricalTwelveData(symbol) {
    const res = await fetch('https://api.twelvedata.com/time_series?symbol=' + symbol + '&interval=1day&outputsize=30&apikey=' + twelveDataKey);
    if (!res.ok) throw new Error("TWELVE_DATA_ERROR_" + res.status);
    var data;
    try { data = await res.json(); } catch (e) { throw new Error("TWELVE_DATA_INVALID_JSON"); }
    if (!data || data.status === 'error' || !data.values) throw new Error("TWELVE_DATA_NO_HISTORICAL");

    return data.values.map(function(item) {
        return {
            date: item.datetime,
            close: parseFloat(item.close)
        };
    }).reverse();
}

async function fetchHistoricalData(symbol) {
    try {
        return await fetchHistoricalFinnhub(symbol);
    } catch (error) {
        console.log('Finnhub historical failed (' + error.message + '), trying Alpha Vantage');
        try {
            return await fetchHistoricalAlphaVantage(symbol);
        } catch (fallbackError) {
            console.log('Alpha Vantage historical failed (' + fallbackError.message + '), trying Twelve Data');
            try {
                return await fetchHistoricalTwelveData(symbol);
            } catch (twelveError) {
                throw new Error("Unable to fetch historical data from any provider.");
            }
        }
    }
}

module.exports = { searchStock, suggestStock, fetchHistoricalData };