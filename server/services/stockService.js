const token = process.env.FINNHUB_API_KEY;
const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
const twelveDataKey = process.env.TWELVE_DATA_API_KEY;

async function searchStock(symbol) {
    try {
        const res = await fetch('https://query2.finance.yahoo.com/v8/finance/chart/' + symbol + '?range=1d&interval=1d').then(function(r) { return r.json(); });

        if (!res || !res.chart || !res.chart.result || !res.chart.result[0] || !res.chart.result[0].meta) {
            throw new Error("Symbol not found");
        }

        const meta = res.chart.result[0].meta;
        const quote = res.chart.result[0].indicators.quote[0];
        const openPrice = (quote && quote.open && quote.open[0]) ? quote.open[0] : meta.regularMarketPrice;

        return {
            symbol: meta.symbol || symbol.toUpperCase(),
            companyName: meta.longName || meta.shortName || symbol.toUpperCase(),
            currentPrice: meta.regularMarketPrice,
            currency: meta.currency || 'USD',
            exchange: meta.fullExchangeName || meta.exchangeName || 'Unknown Exchange',
            marketState: 'ACTIVE',
            previousClose: meta.chartPreviousClose,
            open: openPrice,
            high: meta.regularMarketDayHigh || meta.regularMarketPrice,
            low: meta.regularMarketDayLow || meta.regularMarketPrice,
            volume: meta.regularMarketVolume || 0
        };
    } catch (error) {
        throw new Error(error.message || "Unable to fetch stock information.");
    }
}

async function suggestStockFinnhub(query) {
    const res = await fetch('https://finnhub.io/api/v1/search?q=' + query + '&token=' + token);
    if (res.status === 429) {
        throw new Error("RATE_LIMIT");
    }
    const data = await res.json();
    if (!data || !data.result) {
        throw new Error("RATE_LIMIT");
    }
    return data.result.slice(0, 5).map(function(q) {
        return {
            symbol: q.symbol,
            shortname: q.description,
            exchDisp: q.type
        };
    });
}

async function suggestStockAlphaVantage(query) {
    const res = await fetch('https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=' + query + '&apikey=' + alphaVantageKey);
    const data = await res.json();
    if (!data || !data.bestMatches) {
        return [];
    }
    return data.bestMatches.slice(0, 5).map(function(match) {
        return {
            symbol: match['1. symbol'],
            shortname: match['2. name'],
            exchDisp: match['4. region']
        };
    });
}

async function suggestStockTwelveData(query) {
    const res = await fetch('https://api.twelvedata.com/symbol_search?symbol=' + query + '&outputsize=5');
    const data = await res.json();
    if (!data || !data.data || data.data.length === 0) {
        return [];
    }
    return data.data.slice(0, 5).map(function(item) {
        return {
            symbol: item.symbol,
            shortname: item.instrument_name,
            exchDisp: item.exchange
        };
    });
}

async function suggestStock(query) {
    try {
        return await suggestStockFinnhub(query);
    } catch (error) {
        console.log('Finnhub limit hit, falling back to Alpha Vantage');
        try {
            return await suggestStockAlphaVantage(query);
        } catch (fallbackError) {
            console.log('Alpha Vantage failed, falling back to Twelve Data');
            try {
                return await suggestStockTwelveData(query);
            } catch (twelveError) {
                throw new Error("Unable to fetch stock suggestions from any provider.");
            }
        }
    }
}

async function fetchHistoricalData(symbol) {
    try {
        const res = await fetch('https://query2.finance.yahoo.com/v8/finance/chart/' + symbol + '?range=1mo&interval=1d').then(function(r) { return r.json(); });
        
        if (!res || !res.chart || !res.chart.result || !res.chart.result[0]) {
            throw new Error("No historical data found");
        }
        
        const chartData = res.chart.result[0];
        const timestamps = chartData.timestamp || [];
        const closes = chartData.indicators.quote[0].close || [];
        
        const formatted = [];
        for (let i = 0; i < timestamps.length; i++) {
            if (closes[i] !== null && closes[i] !== undefined) {
                formatted.push({
                    date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
                    close: closes[i]
                });
            }
        }
        return formatted;
    } catch(error) {
        throw new Error(error.message || "Unable to fetch historical data.");
    }
}

module.exports = { searchStock, suggestStock, fetchHistoricalData };