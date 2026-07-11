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

module.exports = { searchStock };