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
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/stock/' + symbol, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStockData(res.data);
            setError('');
        } catch(err) {
            setError(err.response?.data?.message || "Failed to fetch stock");
            setStockData(null);
        }
    }

    return (
        <div>
            <h1 style={{textAlign: "center", marginBottom: "2rem"}}>Search Stock</h1>
            <form onSubmit={handleSubmit} className="search-container">
                <input
                    type="text"
                    className="glow-input"
                    value={symbol}
                    onChange={handleSymbolChange}
                    placeholder="Enter stock symbol (e.g. RELIANCE.NS)"
                />
                <button type="submit" className="btn-glow">Search</button>
            </form>

            {stockData && (
                <div className="glass-panel animate-in" style={{padding: "2.5rem"}}>
                    <div className="stock-header">
                        <div>
                            <h2>{stockData.companyName || stockData.symbol}</h2>
                            <p style={{color: "#94a3b8", margin: 0}}>{stockData.symbol}</p>
                        </div>
                        <div className="stock-price-main">
                            {stockData.currency} {stockData.currentPrice?.toFixed(2)}
                        </div>
                    </div>
                    <div className="stock-grid">
                        <div className="stock-stat-box">
                            <span className="stock-stat-label">Exchange</span>
                            <span className="stock-stat-value">{stockData.exchange}</span>
                        </div>
                        <div className="stock-stat-box">
                            <span className="stock-stat-label">Market State</span>
                            <span className="stock-stat-value">{stockData.marketState}</span>
                        </div>
                        <div className="stock-stat-box">
                            <span className="stock-stat-label">Previous Close</span>
                            <span className="stock-stat-value">{stockData.previousClose?.toFixed(2)}</span>
                        </div>
                        <div className="stock-stat-box">
                            <span className="stock-stat-label">Open</span>
                            <span className="stock-stat-value">{stockData.open?.toFixed(2)}</span>
                        </div>
                        <div className="stock-stat-box">
                            <span className="stock-stat-label">Day High</span>
                            <span className="stock-stat-value">{stockData.high?.toFixed(2)}</span>
                        </div>
                        <div className="stock-stat-box">
                            <span className="stock-stat-label">Day Low</span>
                            <span className="stock-stat-value">{stockData.low?.toFixed(2)}</span>
                        </div>
                        <div className="stock-stat-box">
                            <span className="stock-stat-label">Volume</span>
                            <span className="stock-stat-value">{stockData.volume?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}

            {error && <p className="error-message" style={{textAlign: "center"}}>{error}</p>}
        </div>
    );
}

export default SearchStock;