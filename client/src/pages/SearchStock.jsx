import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { API_BASE_URL } from '../config';
import { useClickOutside } from '../hooks/useClickOutside';

// ---------------------------------------------------------------------------
// Quick-pick stock lists (no backend calls needed to show these)
// ---------------------------------------------------------------------------
const POPULAR_US = [
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'NVDA', name: 'Nvidia' },
    { symbol: 'GOOGL', name: 'Alphabet' },
    { symbol: 'AMZN', name: 'Amazon' },
    { symbol: 'TSLA', name: 'Tesla' },
];

const POPULAR_IN = [
    { symbol: 'RELIANCE', name: 'Reliance Industries' },
    { symbol: 'TCS', name: 'Tata Consultancy' },
    { symbol: 'INFY', name: 'Infosys' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank' },
    { symbol: 'TATAMOTORS', name: 'Tata Motors' },
];

const PLACEHOLDERS = [
    'AAPL · RELIANCE · TCS · MSFT',
    'NVDA · INFY · TSLA · HDFCBANK',
    'GOOGL · TATAMOTORS · AMZN',
    'Search any US or Indian (NSE/BSE) ticker...'
];

const RECENT_KEY = 'sa_recent_searches';

function loadRecent() {
    try {
        const raw = localStorage.getItem(RECENT_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveRecent(list) {
    try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 6)));
    } catch {
        // silent
    }
}

// ---------------------------------------------------------------------------
// Live Market Status (calculated from local time in IST & EST)
// ---------------------------------------------------------------------------
function getMarketStatus() {
    const now = new Date();

    // NSE/BSE: Mon-Fri 09:15 - 15:30 IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000);
    const istDay = istTime.getDay(); // 0 = Sun, 6 = Sat
    const istMinutes = istTime.getHours() * 60 + istTime.getMinutes();
    const nseOpen = istDay >= 1 && istDay <= 5 && istMinutes >= 9 * 60 + 15 && istMinutes < 15 * 60 + 30;

    // NYSE/NASDAQ: Mon-Fri 09:30 - 16:00 EST (UTC-5:00 / UTC-4:00 EDT)
    // Simplified EST: UTC-5
    const estOffset = -5 * 60 * 60 * 1000;
    const estTime = new Date(now.getTime() + estOffset + now.getTimezoneOffset() * 60 * 1000);
    const estDay = estTime.getDay();
    const estMinutes = estTime.getHours() * 60 + estTime.getMinutes();
    const nyseOpen = estDay >= 1 && estDay <= 5 && estMinutes >= 9 * 60 + 30 && estMinutes < 16 * 60;

    return { nseOpen, nyseOpen };
}

function MarketBadge({ name, isOpen }) {
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            padding: '0.25rem 0.65rem',
            borderRadius: '999px',
        }}>
            <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isOpen ? 'var(--green)' : 'var(--red)',
                display: 'inline-block',
                boxShadow: isOpen ? '0 0 6px rgba(34,197,94,0.6)' : 'none',
            }} />
            <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{name}</strong>
            <span>{isOpen ? 'Open' : 'Closed'}</span>
        </span>
    );
}

// ---------------------------------------------------------------------------
// Chart section
// ---------------------------------------------------------------------------
function ChartDot({ cx, cy }) {
    return (
        <circle cx={cx} cy={cy} r={4} fill="#fafafa" stroke="#0A0A0A" strokeWidth={2} />
    );
}

function ChartSection({ historyData, currency }) {
    const chartKey = historyData ? historyData.length + (historyData[0]?.date || '') : 0;

    function formatDate(dateStr) {
        if (!dateStr) return dateStr;
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function formatTick(value) {
        if (currency === 'INR') {
            return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
        }
        return '$' + value.toFixed(0);
    }

    return (
        <motion.div
            className="card chart-section"
            style={{ marginTop: '1.5rem' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <h3>30-Day Price History</h3>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <LineChart key={chartKey} data={historyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis
                            dataKey="date"
                            stroke="#404040"
                            tick={{ fill: '#8A8A8A', fontSize: 11 }}
                            tickMargin={8}
                            tickFormatter={formatDate}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="#404040"
                            tick={{ fill: '#8A8A8A', fontSize: 11 }}
                            tickMargin={8}
                            domain={['auto', 'auto']}
                            tickFormatter={formatTick}
                            width={72}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#141414',
                                border: '1px solid #2a2a2a',
                                borderRadius: '6px',
                                color: '#fafafa',
                                fontSize: '13px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                                padding: '8px 12px',
                            }}
                            itemStyle={{ color: '#fafafa' }}
                            labelStyle={{ color: '#8A8A8A', marginBottom: '2px' }}
                            labelFormatter={formatDate}
                            formatter={function (value) {
                                const sym = currency === 'INR' ? '₹' : '$';
                                return [sym + value.toFixed(2), 'Close'];
                            }}
                            cursor={{ stroke: '#404040', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="close"
                            stroke="#fafafa"
                            strokeWidth={1.75}
                            dot={false}
                            activeDot={<ChartDot />}
                            isAnimationActive={true}
                            animationDuration={900}
                            animationEasing="ease-out"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Main SearchStock Page
// ---------------------------------------------------------------------------
function SearchStock() {
    const [symbol, setSymbol] = useState('');
    const [stockData, setStockData] = useState(null);
    const [error, setError] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [historyData, setHistoryData] = useState(null);
    const [chartLoading, setChartLoading] = useState(false);
    const [showChart, setShowChart] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');
    const [recentSearches, setRecentSearches] = useState(loadRecent);
    const [placeholderIdx, setPlaceholderIdx] = useState(0);

    const { nseOpen, nyseOpen } = useMemo(function () {
        return getMarketStatus();
    }, []);

    // Rotate placeholder text every 3s to hint supported formats
    useEffect(function () {
        const timer = setInterval(function () {
            setPlaceholderIdx(function (prev) { return (prev + 1) % PLACEHOLDERS.length; });
        }, 3000);
        return function () { clearInterval(timer); };
    }, []);

    // Click-outside — no onBlur setTimeout
    const wrapperRef = useRef(null);
    const closeSuggestions = useCallback(function () {
        setShowSuggestions(false);
        setActiveIndex(-1);
    }, []);
    useClickOutside(wrapperRef, closeSuggestions);

    useEffect(function () {
        if (!symbol.trim()) return;

        const id = setTimeout(async function () {
            if (!showSuggestions) return;
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(
                    API_BASE_URL + '/api/stock/suggestions/search?q=' + encodeURIComponent(symbol.trim()),
                    { headers: { Authorization: 'Bearer ' + token } }
                );
                setSuggestions(res.data);
                setActiveIndex(-1);
            } catch {
                // silent
            }
        }, 300);
        return function () { clearTimeout(id); };
    }, [symbol, showSuggestions]);

    function handleSymbolChange(e) {
        const val = e.target.value;
        setSymbol(val);
        if (!val.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
        } else {
            setShowSuggestions(true);
        }
    }

    function handleKeyDown(e) {
        if (!showSuggestions || suggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(function (p) { return Math.min(p + 1, suggestions.length - 1); });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(function (p) { return Math.max(p - 1, -1); });
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            handleSuggestionClick(suggestions[activeIndex]);
        } else if (e.key === 'Escape') {
            closeSuggestions();
        }
    }

    function handleSuggestionClick(s) {
        setSymbol(s.symbol);
        closeSuggestions();
        executeSearch(s.symbol);
    }

    async function executeSearch(searchSymbol) {
        if (!searchSymbol?.trim()) return;
        const clean = searchSymbol.trim().toUpperCase();

        // Push into recent searches
        setRecentSearches(function (prev) {
            const next = [clean, ...prev.filter(function (s) { return s !== clean; })].slice(0, 6);
            saveRecent(next);
            return next;
        });

        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(API_BASE_URL + '/api/stock/' + clean, {
                headers: { Authorization: 'Bearer ' + token }
            });
            setStockData(res.data);
            setError('');
            setShowChart(false);
            setHistoryData(null);
            setAiAnalysis(null);
            setAiError('');
        } catch (err) {
            setError(
                !err.response
                    ? 'Unable to connect to the server. Please ensure the backend is running.'
                    : err.response?.data?.message || `No data found for "${clean}".`
            );
            setStockData(null);
        }
    }

    function handleChipClick(sym) {
        setSymbol(sym);
        executeSearch(sym);
    }

    function handleRemoveRecent(sym, e) {
        e.stopPropagation();
        setRecentSearches(function (prev) {
            const next = prev.filter(function (s) { return s !== sym; });
            saveRecent(next);
            return next;
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        closeSuggestions();
        if (symbol.trim()) executeSearch(symbol);
    }

    async function loadChart() {
        setChartLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(API_BASE_URL + '/api/stock/' + symbol + '/history', {
                headers: { Authorization: 'Bearer ' + token }
            });
            setHistoryData(res.data);
            setShowChart(true);
        } catch {
            setError('Failed to load chart data.');
        } finally {
            setChartLoading(false);
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
        } catch (err) {
            setAiError(err.response?.data?.message || 'AI analysis failed.');
        } finally {
            setAiLoading(false);
        }
    }

    const isPositiveDay = stockData?.change !== undefined ? stockData.change >= 0 : null;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Search</h1>
                <p>Look up US or Indian (NSE/BSE) stocks to view live market data, AI analysis, and historical charts.</p>
            </div>

            {/* Search Box */}
            <div className="search-wrapper" ref={wrapperRef}>
                <form onSubmit={handleSubmit} className="search-container">
                    <input
                        type="text"
                        className="input"
                        value={symbol}
                        onChange={handleSymbolChange}
                        onFocus={function () { if (suggestions.length > 0) setShowSuggestions(true); }}
                        onKeyDown={handleKeyDown}
                        placeholder={PLACEHOLDERS[placeholderIdx]}
                        style={{ flex: 1 }}
                        aria-autocomplete="list"
                        aria-expanded={showSuggestions && suggestions.length > 0}
                        role="combobox"
                        aria-activedescendant={activeIndex >= 0 ? `ss-opt-${activeIndex}` : undefined}
                    />
                    <button type="submit" className="btn-primary">Search</button>
                </form>

                <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                        <motion.div
                            className="suggestions-dropdown"
                            role="listbox"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.14 }}
                        >
                            {suggestions.map(function (s, idx) {
                                return (
                                    <div
                                        id={`ss-opt-${idx}`}
                                        key={idx}
                                        className={'suggestion-item' + (idx === activeIndex ? ' suggestion-item--active' : '')}
                                        role="option"
                                        aria-selected={idx === activeIndex}
                                        onMouseDown={function () { handleSuggestionClick(s); }}
                                        onMouseEnter={function () { setActiveIndex(idx); }}
                                    >
                                        <span className="suggestion-symbol">{s.symbol}</span>
                                        <span className="suggestion-name">{s.shortname} · {s.exchDisp}</span>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Market status pills — gives the page a live terminal feel */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
                marginTop: '-1.5rem',
                marginBottom: '2rem',
            }}>
                <MarketBadge name="NYSE / NASDAQ" isOpen={nyseOpen} />
                <MarketBadge name="NSE / BSE" isOpen={nseOpen} />
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Empty state: shows Popular & Recent when no search is active    */}
            {/* ---------------------------------------------------------------- */}
            {!stockData && !error && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}
                >
                    {/* Recent searches */}
                    {recentSearches.length > 0 && (
                        <div>
                            <span style={{
                                fontSize: '0.72rem',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                display: 'block',
                                marginBottom: '0.6rem',
                            }}>
                                Recent Searches
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {recentSearches.map(function (s) {
                                    return (
                                        <button
                                            key={s}
                                            onClick={function () { handleChipClick(s); }}
                                            className="chip"
                                        >
                                            <span>{s}</span>
                                            <span
                                                onClick={function (e) { handleRemoveRecent(s, e); }}
                                                className="chip-remove"
                                                aria-label="Remove from recent"
                                            >
                                                ×
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Popular US stocks */}
                    <div>
                        <span style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            display: 'block',
                            marginBottom: '0.6rem',
                        }}>
                            Popular US
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {POPULAR_US.map(function (s) {
                                return (
                                    <button
                                        key={s.symbol}
                                        onClick={function () { handleChipClick(s.symbol); }}
                                        className="chip"
                                    >
                                        <strong>{s.symbol}</strong>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{s.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Popular Indian stocks */}
                    <div>
                        <span style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            display: 'block',
                            marginBottom: '0.6rem',
                        }}>
                            Popular Indian (NSE)
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {POPULAR_IN.map(function (s) {
                                return (
                                    <button
                                        key={s.symbol}
                                        onClick={function () { handleChipClick(s.symbol); }}
                                        className="chip"
                                    >
                                        <strong>{s.symbol}</strong>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{s.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Search Format & Capability Hints */}
                    <div style={{ marginTop: '0.5rem' }}>
                        <span style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            display: 'block',
                            marginBottom: '0.6rem',
                        }}>
                            Market Coverage
                        </span>
                        <div className="search-hints-grid">
                            <div className="search-hint-item">
                                <div className="search-hint-header">
                                    <span className="search-hint-icon">🇺🇸</span>
                                    <span>US Equities</span>
                                </div>
                                <p>Real-time pricing in USD via Finnhub with live market status.</p>
                            </div>
                            <div className="search-hint-item">
                                <div className="search-hint-header">
                                    <span className="search-hint-icon">🇮🇳</span>
                                    <span>Indian NSE / BSE</span>
                                </div>
                                <p>Live quotes in ₹ INR with day open, high, low, and 30-day historical data.</p>
                            </div>
                            <div className="search-hint-item">
                                <div className="search-hint-header">
                                    <span className="search-hint-icon">✦</span>
                                    <span>AI Analysis</span>
                                </div>
                                <p>Instant sentiment ratings, buy/sell recommendations, and key risks.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.p
                        className="error-message"
                        style={{ textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>

            {/* Stock Detail Card */}
            <AnimatePresence>
                {stockData && (
                    <motion.div
                        className="card stock-detail"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        <div className="stock-header">
                            <div>
                                <h2>{stockData.companyName || stockData.symbol}</h2>
                                <p className="stock-meta">{stockData.symbol} · {stockData.exchange}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div className="stock-price-main">
                                    {stockData.currency === 'INR' ? '₹' : (stockData.currency || '$')}{' '}
                                    {stockData.currentPrice
                                        ? stockData.currency === 'INR'
                                            ? stockData.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                            : stockData.currentPrice.toFixed(2)
                                        : 'N/A'}
                                </div>
                                {stockData.change !== undefined && stockData.change !== null && (
                                    <div style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        marginTop: '0.25rem',
                                        color: isPositiveDay ? 'var(--green)' : 'var(--red)'
                                    }}>
                                        {isPositiveDay ? '+' : ''}{stockData.change.toFixed(2)}
                                        {stockData.changePercent !== undefined && (
                                            <span style={{ marginLeft: '0.3rem', opacity: 0.8 }}>
                                                ({isPositiveDay ? '+' : ''}{stockData.changePercent.toFixed(2)}%)
                                            </span>
                                        )}
                                    </div>
                                )}
                                <span className="stock-badge">{stockData.marketState}</span>
                            </div>
                        </div>

                        {/* Stats grid */}
                        <div className="stock-grid">
                            {[
                                { label: 'Prev. Close', value: stockData.previousClose },
                                { label: 'Open', value: stockData.open },
                                { label: 'Day High', value: stockData.high },
                                { label: 'Day Low', value: stockData.low },
                            ].map(function (stat) {
                                return (
                                    <div className="stock-stat-box" key={stat.label}>
                                        <span className="stock-stat-label">{stat.label}</span>
                                        <span className="stock-stat-value">
                                            {stockData.currency === 'INR' ? '₹' : '$'}
                                            {stat.value ? stat.value.toFixed(2) : '—'}
                                        </span>
                                    </div>
                                );
                            })}
                            <div className="stock-stat-box">
                                <span className="stock-stat-label">Volume</span>
                                <span className="stock-stat-value">
                                    {stockData.volume ? stockData.volume.toLocaleString() : '—'}
                                </span>
                            </div>
                        </div>

                        {/* Chart controls */}
                        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                            {!historyData && !chartLoading && (
                                <button onClick={loadChart} className="btn-secondary">
                                    Load 30-Day Chart
                                </button>
                            )}
                            {chartLoading && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    Loading chart…
                                </span>
                            )}
                            {historyData && (
                                <button
                                    onClick={function () { setShowChart(function (v) { return !v; }); }}
                                    className="btn-secondary"
                                >
                                    {showChart ? 'Hide Chart' : 'Show Chart'}
                                </button>
                            )}
                        </div>

                        {/* Chart */}
                        <AnimatePresence>
                            {showChart && historyData && (
                                <ChartSection historyData={historyData} currency={stockData.currency} />
                            )}
                        </AnimatePresence>

                        {/* AI Analysis */}
                        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                            {!aiAnalysis && !aiLoading && (
                                <button onClick={loadAIAnalysis} className="btn-secondary">
                                    ✦ AI Analysis
                                </button>
                            )}
                            {aiLoading && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    Running analysis…
                                </span>
                            )}
                        </div>

                        {aiError && <p className="error-message" style={{ textAlign: 'center' }}>{aiError}</p>}

                        <AnimatePresence>
                            {aiAnalysis && (
                                <motion.div
                                    className="card"
                                    style={{ marginTop: '1.5rem', padding: '1.5rem' }}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <h3 style={{ marginBottom: '1rem' }}>✦ AI Analysis</h3>

                                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                        {[
                                            {
                                                label: aiAnalysis.sentiment,
                                                isGood: aiAnalysis.sentiment === 'Bullish',
                                                isBad: aiAnalysis.sentiment === 'Bearish',
                                            },
                                            {
                                                label: aiAnalysis.recommendation,
                                                isGood: aiAnalysis.recommendation === 'Buy',
                                                isBad: aiAnalysis.recommendation === 'Sell',
                                            },
                                        ].map(function (badge) {
                                            const color = badge.isGood ? '#4ade80' : badge.isBad ? '#f87171' : '#94a3b8';
                                            const bg = badge.isGood
                                                ? 'rgba(34,197,94,0.12)'
                                                : badge.isBad
                                                    ? 'rgba(239,68,68,0.12)'
                                                    : 'rgba(148,163,184,0.12)';
                                            const border = badge.isGood
                                                ? 'rgba(34,197,94,0.3)'
                                                : badge.isBad
                                                    ? 'rgba(239,68,68,0.3)'
                                                    : 'rgba(148,163,184,0.3)';
                                            return (
                                                <span key={badge.label} style={{
                                                    display: 'inline-block',
                                                    background: bg,
                                                    color,
                                                    border: '1px solid ' + border,
                                                    padding: '0.35rem 0.85rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                }}>
                                                    {badge.label}
                                                </span>
                                            );
                                        })}
                                    </div>

                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '1.25rem' }}>
                                        {aiAnalysis.summary}
                                    </p>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <h4 style={{ fontSize: '0.75rem', letterSpacing: '0.08em', color: '#4ade80', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Strengths</h4>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                {aiAnalysis.strengths.map(function (s, i) {
                                                    return (
                                                        <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingBottom: '0.3rem', display: 'flex', gap: '0.4rem' }}>
                                                            <span style={{ color: '#4ade80', flexShrink: 0 }}>+</span>
                                                            {s}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '0.75rem', letterSpacing: '0.08em', color: '#f87171', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Risks</h4>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                {aiAnalysis.risks.map(function (r, i) {
                                                    return (
                                                        <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingBottom: '0.3rem', display: 'flex', gap: '0.4rem' }}>
                                                            <span style={{ color: '#f87171', flexShrink: 0 }}>−</span>
                                                            {r}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default SearchStock;
