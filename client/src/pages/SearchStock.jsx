import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function SearchStock() {
    const [symbol, setSymbol] = useState('');
    const [stockData, setStockData] = useState(null);
    const [error, setError] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [historyData, setHistoryData] = useState(null);
    const [showChart, setShowChart] = useState(false);

    useEffect(function() {
        const fetchSuggestions = async function() {
            if (!symbol.trim()) {
                setSuggestions([]);
                return;
            }
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('https://stock-analyzer-api-n9mz.onrender.com/api/stock/suggestions/search?q=' + symbol, {
                    headers: { Authorization: 'Bearer ' + token }
                });
                setSuggestions(res.data);
            } catch (err) {
                console.error("Suggestion fetch failed", err);
            }
        };

        const timeoutId = setTimeout(function() {
            if (showSuggestions) fetchSuggestions();
        }, 300);

        return function() { clearTimeout(timeoutId); };
    }, [symbol, showSuggestions]);

    function handleSymbolChange(event) {
        setSymbol(event.target.value);
        setShowSuggestions(true);
    }

    function handleSuggestionClick(s) {
        setSymbol(s.symbol);
        setShowSuggestions(false);
        executeSearch(s.symbol);
    }

    async function executeSearch(searchSymbol) {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('https://stock-analyzer-api-n9mz.onrender.com/api/stock/' + searchSymbol, {
                headers: { Authorization: 'Bearer ' + token }
            });
            setStockData(res.data);
            setError('');
            setShowChart(false);
            setHistoryData(null);
        } catch(err) {
            setError(err.response?.data?.message || "Failed to fetch stock data.");
            setStockData(null);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setShowSuggestions(false);
        if (symbol.trim()) {
            executeSearch(symbol);
        }
    }

    async function loadChart() {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('https://stock-analyzer-api-n9mz.onrender.com/api/stock/' + symbol + '/history', {
                headers: { Authorization: 'Bearer ' + token }
            });
            setHistoryData(res.data);
            setShowChart(true);
        } catch(err) {
            setError('Failed to load chart data.');
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Search</h1>
                <p>Look up any stock to view live market data. <strong>Note: Only US stock data is available.</strong></p>
            </div>

            <div className="search-wrapper">
                <form onSubmit={handleSubmit} className="search-container">
                    <input
                        type="text"
                        className="input"
                        value={symbol}
                        onChange={handleSymbolChange}
                        onFocus={function() { setShowSuggestions(true); }}
                        onBlur={function() { setTimeout(function() { setShowSuggestions(false); }, 200); }}
                        placeholder="Enter a symbol, e.g. AAPL"
                        style={{flex: 1}}
                    />
                    <button type="submit" className="btn-primary">Search</button>
                </form>

                {showSuggestions && suggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                        {suggestions.map(function(s, idx) {
                            return (
                                <div
                                    key={idx}
                                    className="suggestion-item"
                                    onMouseDown={function() { handleSuggestionClick(s); }}
                                >
                                    <span className="suggestion-symbol">{s.symbol}</span>
                                    <span className="suggestion-name">{s.shortname} · {s.exchDisp}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {error && <p className="error-message" style={{textAlign: "center", maxWidth: "560px", margin: "0 auto"}}>{error}</p>}

            {stockData && (
                <div className="card stock-detail fade-in">
                    <div className="stock-header">
                        <div>
                            <h2>{stockData.companyName || stockData.symbol}</h2>
                            <p className="stock-meta">{stockData.symbol} · {stockData.exchange}</p>
                        </div>
                        <div style={{textAlign: "right"}}>
                            <div className="stock-price-main">
                                {stockData.currency} {stockData.currentPrice ? stockData.currentPrice.toFixed(2) : 'N/A'}
                            </div>
                            <span className="stock-badge">{stockData.marketState}</span>
                        </div>
                    </div>

                    <div className="stock-grid">
                        <div className="stock-stat-box">
                            <span className="stock-stat-label">Prev. Close</span>
                            <span className="stock-stat-value">{stockData.previousClose?.toFixed(2)}</span>
                        </div>
                        <div className="stock-stat-box">
                            <span className="stock-stat-label">Open</span>
                            <span className="stock-stat-value">{stockData.open?.toFixed(2)}</span>
                        </div>
                        <div className="stock-stat-box">
                            <span className="stock-stat-label">High</span>
                            <span className="stock-stat-value">{stockData.high?.toFixed(2)}</span>
                        </div>
                        <div className="stock-stat-box">
                            <span className="stock-stat-label">Low</span>
                            <span className="stock-stat-value">{stockData.low?.toFixed(2)}</span>
                        </div>
                        <div className="stock-stat-box">
                            <span className="stock-stat-label">Volume</span>
                            <span className="stock-stat-value">{stockData.volume?.toLocaleString()}</span>
                        </div>
                    </div>

                    <div style={{textAlign: 'center', marginTop: '1.5rem'}}>
                        {!showChart && (
                            <button onClick={loadChart} className="btn-secondary">Load 30-Day Chart</button>
                        )}
                    </div>

                    {showChart && historyData && (
                        <div className="card chart-section fade-in">
                            <h3>30-Day Price History</h3>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <LineChart data={historyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                                        <XAxis dataKey="date" stroke="#525252" tick={{fill: '#737373', fontSize: 11}} tickMargin={8} />
                                        <YAxis stroke="#525252" tick={{fill: '#737373', fontSize: 11}} tickMargin={8} domain={['auto', 'auto']} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '4px', color: '#fafafa', fontSize: '13px' }}
                                            itemStyle={{ color: '#fafafa' }}
                                            labelStyle={{ color: '#737373' }}
                                        />
                                        <Line type="monotone" dataKey="close" stroke="#fafafa" strokeWidth={1.5} dot={false} activeDot={{ r: 4, fill: '#fafafa', stroke: '#0A0A0A', strokeWidth: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SearchStock;