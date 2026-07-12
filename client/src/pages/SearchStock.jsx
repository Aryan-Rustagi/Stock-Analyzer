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
                    headers: { Authorization: `Bearer ${token}` }
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
            const res = await axios.get('https://stock-analyzer-api-n9mz.onrender.com/api/stock/'+ searchSymbol, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStockData(res.data);
            setError('');
            setShowChart(false);
            setHistoryData(null);
        } catch(err) {
            setError(err.response?.data?.message || "Failed to fetch stock");
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
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistoryData(res.data);
            setShowChart(true);
        } catch(err) {
            setError('Failed to load chart data');
        }
    }

    return (
        <div className="animate-in">
            <div style={{textAlign: "center", marginBottom: "2rem"}}>
                <p className="eyebrow">Live Data</p>
                <h1>Search Stock</h1>
            </div>
            <div className="search-wrapper">
                <form onSubmit={handleSubmit} className="search-container">
                    <input
                        type="text"
                        className="glow-input"
                        value={symbol}
                        onChange={handleSymbolChange}
                        onFocus={function() { setShowSuggestions(true); }}
                        onBlur={function() { setTimeout(function() { setShowSuggestions(false); }, 200); }}
                        placeholder="Enter stock symbol (e.g. RELIANCE.NS)"
                        style={{flex: 1}}
                    />
                    <button type="submit" className="btn-glow">Search</button>
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
                                <span className="suggestion-name">{s.shortname} ({s.exchDisp})</span>
                            </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {stockData && (
                <div className="glass-panel animate-in" style={{padding: "2.5rem"}}>
                    <div className="stock-header">
                        <div>
                            <h2>{stockData.companyName || stockData.symbol}</h2>
                            <p style={{color: "#94a3b8", margin: "0.25rem 0 0 0", fontSize: "0.9rem"}}>{stockData.symbol} · {stockData.exchange}</p>
                        </div>
                        <div style={{textAlign: "right"}}>
                            <div className="stock-price-main">
                                {stockData.currency} {stockData.currentPrice ? stockData.currentPrice.toFixed(2) : 'N/A'}
                            </div>
                            <span className="eyebrow" style={{fontSize: "0.65rem", padding: "0.25rem 0.75rem", marginTop: "0.5rem"}}>{stockData.marketState}</span>
                        </div>
                    </div>
                    <div className="stock-grid">
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

                    <div style={{textAlign: 'center', marginTop: '2rem'}}>
                        {!showChart ? (
                            <button onClick={loadChart} className="btn-glow btn-glass">Load Historical Chart</button>
                        ) : null}
                    </div>

                    {showChart && historyData && (
                        <div className="glass-panel animate-in" style={{ width: '100%', padding: '1.5rem', marginTop: '2rem' }}>
                            <h3 style={{marginBottom: '1.5rem', color: 'var(--accent-primary)', textAlign: 'center'}}>1-Month Price History</h3>
                            <div style={{ width: '100%', height: 350 }}>
                                <ResponsiveContainer>
                                    <LineChart data={historyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="date" stroke="#94a3b8" tick={{fill: '#94a3b8'}} tickMargin={10} />
                                        <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} tickMargin={10} domain={['auto', 'auto']} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(56, 189, 248, 0.3)', borderRadius: '12px', color: '#fff' }}
                                            itemStyle={{ color: '#38bdf8' }}
                                        />
                                        <Line type="monotone" dataKey="close" stroke="#38bdf8" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#38bdf8', stroke: '#fff' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && <p className="error-message" style={{textAlign: "center"}}>{error}</p>}
        </div>
    );
}

export default SearchStock;