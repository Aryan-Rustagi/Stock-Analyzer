import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '../config';

function SearchStock() {
    const [symbol, setSymbol] = useState('');
    const [stockData, setStockData] = useState(null);
    const [error, setError] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [historyData, setHistoryData] = useState(null);
    const [showChart, setShowChart] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');

    useEffect(function() {
        const fetchSuggestions = async function() {
            if (!symbol.trim()) {
                setSuggestions([]);
                return;
            }
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(API_BASE_URL + '/api/stock/suggestions/search?q=' + symbol, {
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
            const res = await axios.get(API_BASE_URL + '/api/stock/' + searchSymbol, {
                headers: { Authorization: 'Bearer ' + token }
            });
            setStockData(res.data);
            setError('');
            setShowChart(false);
            setHistoryData(null);
            setAiAnalysis(null);
            setAiError('');
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
            const res = await axios.get(API_BASE_URL + '/api/stock/' + symbol + '/history', {
                headers: { Authorization: 'Bearer ' + token }
            });
            setHistoryData(res.data);
            setShowChart(true);
        } catch(err) {
            setError('Failed to load chart data.');
        }
    }

    async function loadAIAnalysis() {
        setAiLoading(true);
        setAiError('');
        setAiAnalysis(null);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(API_BASE_URL + '/api/ai/analyze/' + symbol, {
                headers: { Authorization: 'Bearer ' + token }
            });
            setAiAnalysis(res.data.analysis);
        } catch(err) {
            setAiError(err.response?.data?.message || 'AI analysis failed.');
        }
        setAiLoading(false);
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

                    <div style={{textAlign: 'center', marginTop: '1.5rem'}}>
                        {!aiAnalysis && !aiLoading && (
                            <button onClick={loadAIAnalysis} className="btn-secondary" style={{marginLeft: '0.5rem'}}>✦ AI Analysis</button>
                        )}
                        {aiLoading && <p style={{color: 'var(--text-muted)', fontSize: '0.875rem'}}>Running AI analysis...</p>}
                    </div>

                    {aiError && <p className="error-message" style={{textAlign: 'center'}}>{aiError}</p>}

                    {aiAnalysis && (
                        <div className="card fade-in" style={{marginTop: '1.5rem', borderTop: '1px solid #262626', paddingTop: '1.5rem'}}>
                            <h3 style={{marginBottom: '1rem'}}>✦ AI Analysis</h3>

                            <div style={{display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap'}}>
                                <span className="stock-badge" style={{
                                    background: aiAnalysis.sentiment === 'Bullish' ? 'rgba(34,197,94,0.15)' : aiAnalysis.sentiment === 'Bearish' ? 'rgba(239,68,68,0.15)' : 'rgba(250,204,21,0.15)',
                                    color: aiAnalysis.sentiment === 'Bullish' ? '#4ade80' : aiAnalysis.sentiment === 'Bearish' ? '#f87171' : '#fcd34d',
                                    padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600
                                }}>
                                    {aiAnalysis.sentiment}
                                </span>
                                <span className="stock-badge" style={{
                                    background: aiAnalysis.recommendation === 'Buy' ? 'rgba(34,197,94,0.15)' : aiAnalysis.recommendation === 'Sell' ? 'rgba(239,68,68,0.15)' : 'rgba(148,163,184,0.15)',
                                    color: aiAnalysis.recommendation === 'Buy' ? '#4ade80' : aiAnalysis.recommendation === 'Sell' ? '#f87171' : '#94a3b8',
                                    padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600
                                }}>
                                    {aiAnalysis.recommendation}
                                </span>
                            </div>

                            <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '1.25rem'}}>{aiAnalysis.summary}</p>

                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                                <div>
                                    <h4 style={{fontSize: '0.8rem', letterSpacing: '0.08em', color: '#4ade80', marginBottom: '0.5rem', textTransform: 'uppercase'}}>Strengths</h4>
                                    <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                                        {aiAnalysis.strengths.map(function(s, i) {
                                            return <li key={i} style={{fontSize: '0.85rem', color: 'var(--text-muted)', paddingBottom: '0.3rem'}}>+ {s}</li>;
                                        })}
                                    </ul>
                                </div>
                                <div>
                                    <h4 style={{fontSize: '0.8rem', letterSpacing: '0.08em', color: '#f87171', marginBottom: '0.5rem', textTransform: 'uppercase'}}>Risks</h4>
                                    <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                                        {aiAnalysis.risks.map(function(r, i) {
                                            return <li key={i} style={{fontSize: '0.85rem', color: 'var(--text-muted)', paddingBottom: '0.3rem'}}>- {r}</li>;
                                        })}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SearchStock;