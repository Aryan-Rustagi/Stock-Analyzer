const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance();

async function searchStock(symbol) {
    try {
        const result = await yahooFinance.quote(symbol);

        return {
            symbol: result.symbol,
            companyName: result.longName,
            currentPrice: result.regularMarketPrice,
            currency: result.currency,
            exchange: result.fullExchangeName,
            marketState: result.marketState,
            previousClose: result.regularMarketPreviousClose,
            open: result.regularMarketOpen,
            high: result.regularMarketDayHigh,
            low: result.regularMarketDayLow,
            volume: result.regularMarketVolume
        };
    } catch (error) {
        throw new Error("Unable to fetch stock information.");
    }
}

async function suggestStock(query) {
    try {
        const result = await yahooFinance.search(query, { quotesCount: 5, newsCount: 0 });
        return result.quotes.map(function(q) {
            return {
                symbol: q.symbol,
                shortname: q.shortname || q.longname,
                exchDisp: q.exchDisp
            };
        });
    } catch (error) {
        throw new Error("Unable to fetch stock suggestions.");
    }
}

async function fetchHistoricalData(symbol) {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);

        const result = await yahooFinance.chart(symbol, {
            period1: startDate,
            period2: endDate,
            interval: '1d'
        });

        return result.quotes.map(function(item) {
            return {
                date: item.date.toISOString().split('T')[0],
                close: item.close
            };
        });
    } catch(error) {
        throw new Error("Unable to fetch historical data.");
    }
}

module.exports = { searchStock, suggestStock, fetchHistoricalData };