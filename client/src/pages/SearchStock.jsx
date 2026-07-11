import { useState } from 'react';
import axios from 'axios';

function SearchStock() {

    const [symbol, setSymbol] = useState('');
    const [stockData, setStockData] = useState(null);
    const [error, setError] = useState('');

    function handleSymbolChange(event) {
        setSymbol(event.target.value);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        try {
            const res = await axios.get('http://localhost:5000/api/stock/' + symbol);
            setStockData(res.data);
            setError('');
        } catch(err) {
            setError(err.response.data.message);
            setStockData(null);
        }
    }

    return (
        <div>
            <h1>Search Stock</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={symbol}
                    onChange={handleSymbolChange}
                    placeholder="Enter stock symbol"
                />
                <button type="submit">Search</button>
            </form>

            {stockData && (
                <div>
                    <h2>{stockData.symbol}</h2>
                    <p>Company Name: {stockData.companyName}</p>
                    <p>Current Price: {stockData.currentPrice}</p>
                    <p>Currency: {stockData.currency}</p>
                    <p>Exchange: {stockData.exchange}</p>
                    <p>Market State: {stockData.marketState}</p>
                    <p>Previous Close: {stockData.previousClose}</p>
                    <p>Open: {stockData.open}</p>
                    <p>High: {stockData.high}</p>
                    <p>Low: {stockData.low}</p>
                    <p>Volume: {stockData.volume}</p>
                </div>
            )}

            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default SearchStock;