import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useClickOutside } from '../hooks/useClickOutside';

// ---------------------------------------------------------------------------
// Market Benchmarks & Sector Data (Tabular, clean, professional)
// ---------------------------------------------------------------------------
const BENCHMARK_INDICES = [
    { name: 'NIFTY 50', region: 'India · NSE', price: '24,148.20', change: '+102.40', changePercent: '+0.42%', isPositive: true },
    { name: 'SENSEX', region: 'India · BSE', price: '79,486.32', change: '+276.15', changePercent: '+0.35%', isPositive: true },
    { name: 'BANK NIFTY', region: 'India · NSE', price: '51,780.50', change: '+314.80', changePercent: '+0.61%', isPositive: true },
    { name: 'S&P 500', region: 'US · NYSE', price: '5,864.67', change: '-7.15', changePercent: '-0.12%', isPositive: false },
    { name: 'NASDAQ 100', region: 'US · NASDAQ', price: '20,380.12', change: '-51.20', changePercent: '-0.25%', isPositive: false },
    { name: 'DOW JONES', region: 'US · NYSE', price: '42,863.86', change: '+34.20', changePercent: '+0.08%', isPositive: true }
];

const SECTOR_GROUPS = [
    {
        title: 'Tech & Semiconductors',
        icon: '💻',
        stocks: [
            { symbol: 'AAPL', name: 'Apple Inc.', exch: 'NASDAQ' },
            { symbol: 'NVDA', name: 'NVIDIA Corp.', exch: 'NASDAQ' },
            { symbol: 'MSFT', name: 'Microsoft Corp.', exch: 'NASDAQ' },
            { symbol: 'TCS', name: 'Tata Consultancy', exch: 'NSE' },
            { symbol: 'INFY', name: 'Infosys Ltd.', exch: 'NSE' }
        ]
    },
    {
        title: 'Banking & Financials',
        icon: '🏦',
        stocks: [
            { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', exch: 'NSE' },
            { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', exch: 'NSE' },
            { symbol: 'SBIN', name: 'State Bank of India', exch: 'NSE' },
            { symbol: 'JPM', name: 'JPMorgan Chase', exch: 'NYSE' },
            { symbol: 'BAC', name: 'Bank of America', exch: 'NYSE' }
        ]
    },
    {
        title: 'Energy, Auto & Industrials',
        icon: '⚡',
        stocks: [
            { symbol: 'RELIANCE', name: 'Reliance Industries', exch: 'NSE' },
            { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', exch: 'NSE' },
            { symbol: 'TSLA', name: 'Tesla Inc.', exch: 'NASDAQ' },
            { symbol: 'XOM', name: 'Exxon Mobil', exch: 'NYSE' },
            { symbol: 'MARUTI', name: 'Maruti Suzuki', exch: 'NSE' }
        ]
    },
    {
        title: 'Consumer, Media & Health',
        icon: '🌐',
        stocks: [
            { symbol: 'AMZN', name: 'Amazon.com Inc.', exch: 'NASDAQ' },
            { symbol: 'GOOGL', name: 'Alphabet Inc.', exch: 'NASDAQ' },
            { symbol: 'SUNPHARMA', name: 'Sun Pharma', exch: 'NSE' },
            { symbol: 'ITC', name: 'ITC Ltd.', exch: 'NSE' },
            { symbol: 'META', name: 'Meta Platforms', exch: 'NASDAQ' }
        ]
    }
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
// Live Market Status (IST & EST)
// ---------------------------------------------------------------------------
function getMarketStatus() {
    const now = new Date();

    // NSE/BSE: Mon-Fri 09:15 - 15:30 IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000);
    const istDay = istTime.getDay();
    const istMinutes = istTime.getHours() * 60 + istTime.getMinutes();
    const nseOpen = istDay >= 1 && istDay <= 5 && istMinutes >= 9 * 60 + 15 && istMinutes < 15 * 60 + 30;

    // NYSE/NASDAQ: Mon-Fri 09:30 - 16:00 EST (UTC-5:00)
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
            <span style={{ color: isOpen ? 'var(--green)' : 'var(--text-muted)' }}>
                {isOpen ? 'Open' : 'Closed'}
            </span>
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
            <div style={{ width: '100%', height: 320 }}>
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
// Main SearchStock Page (Trading Terminal Layout)
// ---------------------------------------------------------------------------
function SearchStock() {
    const { token, isAuthenticated } = useAuth();
    const [searchParams] = useSearchParams();

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

    // Watchlist sidebar state
    const [watchlist, setWatchlist] = useState([]);
    const [watchlistLoading, setWatchlistLoading] = useState(false);
    const [addingToWatchlist, setAddingToWatchlist] = useState(false);
    const [watchlistFeedback, setWatchlistFeedback] = useState('');

    const { nseOpen, nyseOpen } = useMemo(function () {
        return getMarketStatus();
    }, []);

    // Rotate placeholder text every 3s
    useEffect(function () {
        const timer = setInterval(function () {
            setPlaceholderIdx(function (prev) { return (prev + 1) % PLACEHOLDERS.length; });
        }, 3000);
        return function () { clearInterval(timer); };
    }, []);

    // Load user's watchlist for the right sidebar
    const loadWatchlist = useCallback(async function () {
        if (!token) return;
        try {
            const res = await axios.get(API_BASE_URL + '/api/portfolio', {
                headers: { Authorization: 'Bearer ' + token }
            });
            setWatchlist(res.data || []);
        } catch {
            // silent for background widget
        } finally {
            setWatchlistLoading(false);
        }
    }, [token]);

    useEffect(function () {
        if (!token) return;
        let isMounted = true;
        axios.get(API_BASE_URL + '/api/portfolio', {
            headers: { Authorization: 'Bearer ' + token }
        })
        .then(function (res) {
            if (isMounted) {
                setWatchlist(res.data || []);
                setWatchlistLoading(false);
            }
        })
        .catch(function () {
            if (isMounted) setWatchlistLoading(false);
        });

        return function () { isMounted = false; };
    }, [token]);

    // Click-outside for search autocomplete
    const wrapperRef = useRef(null);
    const closeSuggestions = useCallback(function () {
        setShowSuggestions(false);
        setActiveIndex(-1);
    }, []);
    useClickOutside(wrapperRef, closeSuggestions);

    // Autocomplete fetcher with debounce
    useEffect(function () {
        if (!symbol.trim()) return;

        const id = setTimeout(async function () {
            if (!showSuggestions) return;
            try {
                const authToken = localStorage.getItem('token');
                const res = await axios.get(
                    API_BASE_URL + '/api/stock/suggestions/search?q=' + encodeURIComponent(symbol.trim()),
                    { headers: { Authorization: 'Bearer ' + authToken } }
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

    const executeSearch = useCallback(async function (searchSymbol) {
        if (!searchSymbol?.trim()) return;
        const clean = searchSymbol.trim().toUpperCase();

        // Push to recent searches
        setRecentSearches(function (prev) {
            const next = [clean, ...prev.filter(function (s) { return s !== clean; })].slice(0, 6);
            saveRecent(next);
            return next;
        });

        try {
            const authToken = localStorage.getItem('token');
            const res = await axios.get(API_BASE_URL + '/api/stock/' + clean, {
                headers: { Authorization: 'Bearer ' + authToken }
            });
            setStockData(res.data);
            setError('');
            setShowChart(false);
            setHistoryData(null);
            setAiAnalysis(null);
            setAiError('');
            setWatchlistFeedback('');
        } catch (err) {
            setError(
                !err.response
                    ? 'Unable to connect to the server. Please ensure the backend is running.'
                    : err.response?.data?.message || `No data found for "${clean}".`
            );
            setStockData(null);
        }
    }, []);

    // Auto-search if ?symbol= query parameter is passed
    useEffect(function () {
        const qSym = searchParams.get('symbol');
        if (!qSym || !qSym.trim()) return;
        const clean = qSym.trim().toUpperCase();

        let isMounted = true;
        const authToken = localStorage.getItem('token');
        axios.get(API_BASE_URL + '/api/stock/' + clean, {
            headers: { Authorization: 'Bearer ' + authToken }
        })
        .then(function (res) {
            if (isMounted) {
                setStockData(res.data);
                setSymbol(clean);
                setError('');
            }
        })
        .catch(function (err) {
            if (isMounted) {
                setError(err.response?.data?.message || `No data found for "${clean}".`);
            }
        });

        return function () { isMounted = false; };
    }, [searchParams]);

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
            const authToken = localStorage.getItem('token');
            const res = await axios.get(API_BASE_URL + '/api/stock/' + symbol + '/history', {
                headers: { Authorization: 'Bearer ' + authToken }
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
            const authToken = localStorage.getItem('token');
            const res = await axios.get(API_BASE_URL + '/api/ai/analyze/' + symbol, {
                headers: { Authorization: 'Bearer ' + authToken }
            });
            setAiAnalysis(res.data.analysis);
        } catch (err) {
            setAiError(err.response?.data?.message || 'AI analysis failed.');
        } finally {
            setAiLoading(false);
        }
    }

    // Add current stock to watchlist
    async function handleAddToWatchlist() {
        if (!token) {
            setWatchlistFeedback('Sign in to save stocks to your watchlist.');
            return;
        }
        if (!stockData?.symbol || addingToWatchlist) return;

        setAddingToWatchlist(true);
        setWatchlistFeedback('');
        try {
            await axios.post(
                API_BASE_URL + '/api/portfolio/add',
                { symbol: stockData.symbol },
                { headers: { Authorization: 'Bearer ' + token } }
            );
            setWatchlistFeedback(`✓ ${stockData.symbol} added to watchlist`);
            await loadWatchlist();
        } catch (err) {
            setWatchlistFeedback(err.response?.data?.message || 'Failed to add to watchlist');
        } finally {
            setAddingToWatchlist(false);
        }
    }

    const isInWatchlist = useMemo(function () {
        if (!stockData?.symbol || !watchlist.length) return false;
        return watchlist.some(function (w) { return w.symbol === stockData.symbol; });
    }, [stockData, watchlist]);

    const isPositiveDay = stockData?.change !== undefined ? stockData.change >= 0 : null;

    return (
        <div className="fade-in">
            {/* 3-Column Terminal Layout */}
            <div className="terminal-layout">

                {/* ============================================================ */}
                {/* LEFT SIDEBAR: Macro Benchmark Indices & Market Hours         */}
                {/* ============================================================ */}
                <aside className="terminal-sidebar terminal-left-sidebar">
                    {/* Market Indices Card */}
                    <div className="terminal-card">
                        <div className="terminal-card-title">
                            <span>Market Indices</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>LIVE BENCHMARKS</span>
                        </div>

                        <div>
                            {BENCHMARK_INDICES.map(function (idx) {
                                return (
                                    <div key={idx.name} className="terminal-index-item">
                                        <div>
                                            <span className="terminal-index-name">{idx.name}</span>
                                            <span className="terminal-index-region">{idx.region}</span>
                                        </div>
                                        <div className="terminal-index-values">
                                            <span className="terminal-index-price">{idx.price}</span>
                                            <span className={idx.isPositive ? 'price-tag-up' : 'price-tag-down'}>
                                                {idx.isPositive ? '▲ ' : '▼ '}{idx.changePercent}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Market Hours Card */}
                    <div className="terminal-card">
                        <div className="terminal-card-title">
                            <span>Exchange Status</span>
                            <span style={{ fontSize: '0.65rem' }}>HOURS</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                                <span style={{ color: 'var(--text)' }}>NSE / BSE (India)</span>
                                <span className={nseOpen ? 'price-pill-up' : 'price-pill-down'}>
                                    {nseOpen ? '● OPEN' : '○ CLOSED'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                                <span style={{ color: 'var(--text)' }}>NYSE / NASDAQ (US)</span>
                                <span className={nyseOpen ? 'price-pill-up' : 'price-pill-down'}>
                                    {nyseOpen ? '● OPEN' : '○ CLOSED'}
                                </span>
                            </div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0', lineHeight: 1.4 }}>
                                Trading hours auto-adjusted to your local time.
                            </p>
                        </div>
                    </div>
                </aside>

                {/* ============================================================ */}
                {/* CENTER COLUMN: Search, Detail, Charts, AI, & Sector Grids     */}
                {/* ============================================================ */}
                <main className="terminal-main-content">
                    <div className="page-header" style={{ marginBottom: '1.25rem' }}>
                        <h1>Search & Analytics</h1>
                        <p>Search any US or Indian (NSE/BSE) stock for real-time prices, historical charts, and AI analysis.</p>
                    </div>

                    {/* Search Input Box */}
                    <div className="search-wrapper" ref={wrapperRef} style={{ maxWidth: '100%', marginBottom: '1.25rem' }}>
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

                    {/* Quick status line */}
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                        <MarketBadge name="NYSE / NASDAQ" isOpen={nyseOpen} />
                        <MarketBadge name="NSE / BSE" isOpen={nseOpen} />

                        {recentSearches.length > 0 && (
                            <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Recent:</span>
                                {recentSearches.slice(0, 4).map(function (s) {
                                    return (
                                        <button
                                            key={s}
                                            onClick={function () { handleChipClick(s); }}
                                            className="chip"
                                            style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
                                        >
                                            <span>{s}</span>
                                            <span
                                                onClick={function (e) { handleRemoveRecent(s, e); }}
                                                className="chip-remove"
                                                aria-label="Remove"
                                            >
                                                ×
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Error Banner */}
                    <AnimatePresence>
                        {error && (
                            <motion.p
                                className="error-message"
                                style={{ textAlign: 'center', margin: '0 0 1.25rem 0' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    {/* Active Stock Detail Display */}
                    <AnimatePresence>
                        {stockData && (
                            <motion.div
                                className="card stock-detail"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                            >
                                <div className="stock-header">
                                    <div>
                                        <h2>{stockData.companyName || stockData.symbol}</h2>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                                            <p className="stock-meta" style={{ margin: 0 }}>
                                                {stockData.symbol} · {stockData.exchange}
                                            </p>
                                            <span className="stock-badge">{stockData.marketState || 'REGULAR'}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                                        <div className="stock-price-main">
                                            {stockData.currency === 'INR' ? '₹' : (stockData.currency || '$')}{' '}
                                            {stockData.currentPrice
                                                ? (stockData.currency === 'INR'
                                                    ? stockData.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                    : stockData.currentPrice.toFixed(2))
                                                : 'N/A'}
                                        </div>
                                        {/* Day Change Pill */}
                                        {stockData.change !== undefined && stockData.change !== null && (
                                            <div className={isPositiveDay ? 'price-pill-up' : 'price-pill-down'}>
                                                <span>{isPositiveDay ? '▲ +' : '▼ '}</span>
                                                <span>{stockData.change.toFixed(2)}</span>
                                                {stockData.changePercent !== undefined && (
                                                    <span>({isPositiveDay ? '+' : ''}{stockData.changePercent.toFixed(2)}%)</span>
                                                )}
                                            </div>
                                        )}

                                        {/* 1-Click Watchlist button */}
                                        <div style={{ marginTop: '0.2rem' }}>
                                            <button
                                                type="button"
                                                onClick={handleAddToWatchlist}
                                                disabled={addingToWatchlist || isInWatchlist}
                                                className={isInWatchlist ? 'btn-secondary' : 'btn-primary'}
                                                style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                                            >
                                                {addingToWatchlist ? 'Saving...' : isInWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}
                                            </button>
                                        </div>
                                        {watchlistFeedback && (
                                            <span style={{ fontSize: '0.72rem', color: isInWatchlist ? 'var(--green)' : 'var(--red)' }}>
                                                {watchlistFeedback}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* 5-Metric Valuation Grid */}
                                <div className="stock-grid">
                                    <div className="stock-stat-box">
                                        <span className="stock-stat-label">Prev. Close</span>
                                        <span className="stock-stat-value">
                                            {stockData.currency === 'INR' ? '₹' : '$'}{stockData.previousClose ? stockData.previousClose.toFixed(2) : '—'}
                                        </span>
                                    </div>
                                    <div className="stock-stat-box">
                                        <span className="stock-stat-label">Open</span>
                                        <span className="stock-stat-value">
                                            {stockData.currency === 'INR' ? '₹' : '$'}{stockData.open ? stockData.open.toFixed(2) : '—'}
                                        </span>
                                    </div>
                                    <div className="stock-stat-box">
                                        <span className="stock-stat-label">Day High</span>
                                        <span className="stock-stat-value" style={{ color: '#22c55e' }}>
                                            {stockData.currency === 'INR' ? '₹' : '$'}{stockData.high ? stockData.high.toFixed(2) : '—'}
                                        </span>
                                    </div>
                                    <div className="stock-stat-box">
                                        <span className="stock-stat-label">Day Low</span>
                                        <span className="stock-stat-value" style={{ color: '#ef4444' }}>
                                            {stockData.currency === 'INR' ? '₹' : '$'}{stockData.low ? stockData.low.toFixed(2) : '—'}
                                        </span>
                                    </div>
                                    <div className="stock-stat-box">
                                        <span className="stock-stat-label">Volume</span>
                                        <span className="stock-stat-value">
                                            {stockData.volume ? stockData.volume.toLocaleString() : '—'}
                                        </span>
                                    </div>
                                </div>

                                {/* Chart Controls */}
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
                                    {!historyData && !chartLoading && (
                                        <button onClick={loadChart} className="btn-secondary">
                                            Load 30-Day Historical Chart
                                        </button>
                                    )}
                                    {chartLoading && (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                            Loading chart data...
                                        </span>
                                    )}
                                    {historyData && (
                                        <button
                                            onClick={function () { setShowChart(function (v) { return !v; }); }}
                                            className="btn-secondary"
                                        >
                                            {showChart ? 'Hide Chart' : 'Show 30-Day Chart'}
                                        </button>
                                    )}

                                    {!aiAnalysis && !aiLoading && (
                                        <button onClick={loadAIAnalysis} className="btn-secondary">
                                            ✦ AI Financial Analysis
                                        </button>
                                    )}
                                    {aiLoading && (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                            Generating AI analysis...
                                        </span>
                                    )}
                                </div>

                                {/* Recharts Interactive 30-Day Chart */}
                                <AnimatePresence>
                                    {showChart && historyData && (
                                        <ChartSection historyData={historyData} currency={stockData.currency} />
                                    )}
                                </AnimatePresence>

                                {aiError && <p className="error-message" style={{ textAlign: 'center', marginTop: '1.25rem' }}>{aiError}</p>}

                                {/* AI Analysis Panel */}
                                <AnimatePresence>
                                    {aiAnalysis && (
                                        <motion.div
                                            className="card"
                                            style={{ marginTop: '1.5rem', padding: '1.5rem', borderTop: '1px solid #262626' }}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                <h3 style={{ margin: 0 }}>✦ AI Financial Analysis</h3>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <span className="stock-badge" style={{
                                                        background: aiAnalysis.sentiment === 'Bullish' ? 'rgba(34,197,94,0.15)' : aiAnalysis.sentiment === 'Bearish' ? 'rgba(239,68,68,0.15)' : 'rgba(250,204,21,0.15)',
                                                        color: aiAnalysis.sentiment === 'Bullish' ? '#4ade80' : aiAnalysis.sentiment === 'Bearish' ? '#f87171' : '#fcd34d',
                                                        border: '1px solid',
                                                        borderColor: aiAnalysis.sentiment === 'Bullish' ? 'rgba(34,197,94,0.3)' : aiAnalysis.sentiment === 'Bearish' ? 'rgba(239,68,68,0.3)' : 'rgba(250,204,21,0.3)'
                                                    }}>
                                                        {aiAnalysis.sentiment}
                                                    </span>
                                                    <span className="stock-badge" style={{
                                                        background: aiAnalysis.recommendation === 'Buy' ? 'rgba(34,197,94,0.15)' : aiAnalysis.recommendation === 'Sell' ? 'rgba(239,68,68,0.15)' : 'rgba(148,163,184,0.15)',
                                                        color: aiAnalysis.recommendation === 'Buy' ? '#4ade80' : aiAnalysis.recommendation === 'Sell' ? '#f87171' : '#94a3b8',
                                                        border: '1px solid',
                                                        borderColor: aiAnalysis.recommendation === 'Buy' ? 'rgba(34,197,94,0.3)' : aiAnalysis.recommendation === 'Sell' ? 'rgba(239,68,68,0.3)' : 'rgba(148,163,184,0.3)'
                                                    }}>
                                                        {aiAnalysis.recommendation}
                                                    </span>
                                                </div>
                                            </div>

                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '1.25rem' }}>
                                                {aiAnalysis.summary}
                                            </p>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <div>
                                                    <h4 style={{ fontSize: '0.75rem', letterSpacing: '0.08em', color: '#4ade80', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                        Strengths
                                                    </h4>
                                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                        {aiAnalysis.strengths.map(function (s, i) {
                                                            return (
                                                                <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingBottom: '0.35rem', display: 'flex', gap: '0.4rem' }}>
                                                                    <span style={{ color: '#4ade80', flexShrink: 0 }}>+</span>
                                                                    <span>{s}</span>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                                <div>
                                                    <h4 style={{ fontSize: '0.75rem', letterSpacing: '0.08em', color: '#f87171', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                        Risks
                                                    </h4>
                                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                        {aiAnalysis.risks.map(function (r, i) {
                                                            return (
                                                                <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingBottom: '0.35rem', display: 'flex', gap: '0.4rem' }}>
                                                                    <span style={{ color: '#f87171', flexShrink: 0 }}>−</span>
                                                                    <span>{r}</span>
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

                    {/* ======================================================== */}
                    {/* Empty State: Structured Sector Groups (Full Width)        */}
                    {/* ======================================================== */}
                    {!stockData && !error && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                        >
                            {/* Sector Grids */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Explore by Sector
                                    </span>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Click any stock to inspect</span>
                                </div>

                                <div className="sector-groups-grid">
                                    {SECTOR_GROUPS.map(function (sector) {
                                        return (
                                            <div key={sector.title} className="sector-card">
                                                <div className="sector-card-header">
                                                    <span className="sector-card-icon">{sector.icon}</span>
                                                    <span className="sector-card-title">{sector.title}</span>
                                                </div>
                                                <div className="sector-stocks-list">
                                                    {sector.stocks.map(function (stk) {
                                                        return (
                                                            <button
                                                                key={stk.symbol}
                                                                type="button"
                                                                className="sector-stock-row"
                                                                onClick={function () { handleChipClick(stk.symbol); }}
                                                            >
                                                                <div className="sector-stock-left">
                                                                    <span className="sector-stock-symbol">{stk.symbol}</span>
                                                                    <span className="sector-stock-name">{stk.name}</span>
                                                                </div>
                                                                <span className="sector-stock-badge">{stk.exch}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Market Coverage Guide Cards */}
                            <div className="search-hints-grid">
                                <div className="search-hint-item">
                                    <div className="search-hint-header">
                                        <span className="search-hint-icon">🇺🇸</span>
                                        <span>US Markets</span>
                                    </div>
                                    <p>Real-time quotes in USD via Finnhub with live trading hours and day highs/lows.</p>
                                </div>
                                <div className="search-hint-item">
                                    <div className="search-hint-header">
                                        <span className="search-hint-icon">🇮🇳</span>
                                        <span>Indian NSE / BSE</span>
                                    </div>
                                    <p>Live quotes in ₹ INR with full daily technical metrics and historical OHLCV data.</p>
                                </div>
                                <div className="search-hint-item">
                                    <div className="search-hint-header">
                                        <span className="search-hint-icon">✦</span>
                                        <span>AI Sentiment</span>
                                    </div>
                                    <p>Automated reasoning engine providing instant bullish/bearish ratings and risk summaries.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </main>

                {/* ============================================================ */}
                {/* RIGHT SIDEBAR: Live Mini-Watchlist / Portfolio Sync           */}
                {/* ============================================================ */}
                <aside className="terminal-sidebar terminal-right-sidebar">
                    <div className="terminal-card">
                        <div className="terminal-card-title">
                            <span>My Watchlist</span>
                            <span style={{ fontSize: '0.65rem' }}>
                                {watchlist.length} {watchlist.length === 1 ? 'STOCK' : 'STOCKS'}
                            </span>
                        </div>

                        {watchlistLoading && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                                Syncing watchlist...
                            </p>
                        )}

                        {!isAuthenticated && (
                            <div style={{ padding: '0.75rem 0', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                                    Sign in to track live stocks and sync across devices.
                                </p>
                                <Link to="/login">
                                    <button className="btn-primary" style={{ width: '100%', fontSize: '0.78rem', padding: '0.4rem' }}>
                                        Sign In
                                    </button>
                                </Link>
                            </div>
                        )}

                        {isAuthenticated && !watchlistLoading && watchlist.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                    Your watchlist is empty.
                                </p>
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    Search any ticker and click "+ Add to Watchlist" to track it here.
                                </p>
                            </div>
                        )}

                        {isAuthenticated && watchlist.length > 0 && (
                            <div>
                                {watchlist.map(function (item) {
                                    const isItemPositive = item.change !== undefined ? item.change >= 0 : null;
                                    const isActiveStock = stockData?.symbol === item.symbol;

                                    return (
                                        <div
                                            key={item._id || item.symbol}
                                            className={'watchlist-item' + (isActiveStock ? ' watchlist-item--active' : '')}
                                            onClick={function () { handleChipClick(item.symbol); }}
                                            title={`Click to inspect ${item.symbol}`}
                                        >
                                            <div>
                                                <span className="watchlist-symbol">{item.symbol}</span>
                                                <span className="watchlist-name">{item.companyName || item.symbol}</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                {item.price !== undefined && item.price !== null ? (
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
                                                        {item.currency === 'INR' ? '₹' : '$'}{item.price.toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>
                                                )}
                                                {item.change !== undefined && item.change !== null && (
                                                    <span className={isItemPositive ? 'price-tag-up' : 'price-tag-down'} style={{ fontSize: '0.72rem' }}>
                                                        {isItemPositive ? '▲ +' : '▼ '}
                                                        {item.changePercent !== undefined ? item.changePercent.toFixed(2) + '%' : item.change.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                <div style={{ borderTop: '1px solid #1a1a1a', marginTop: '0.75rem', paddingTop: '0.75rem', textAlign: 'center' }}>
                                    <Link to="/portfolio" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        Manage full portfolio →
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

            </div>
        </div>
    );
}

export default SearchStock;
