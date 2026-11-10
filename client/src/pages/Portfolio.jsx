import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

function Portfolio() {
    const { token } = useAuth();
    const [stock, setStock] = useState([]);
    const [symbol, setSymbol] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [removingId, setRemovingId] = useState(null);

    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceTimerRef = useRef(null);

    async function loadPortfolio() {
        if (!token) return;
        try {
            const response = await axios.get(
                API_BASE_URL + '/api/portfolio',
                { headers: { Authorization: 'Bearer ' + token } }
            );
            setStock(response.data);
            setError('');
        } catch(err) {
            if (err.response?.status === 401) {
                setError('Session expired or unauthorized. Please log in again.');
            } else {
                setError(err.response?.data?.message || 'Failed to load portfolio.');
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let isMounted = true;
        if (!token) {
            return;
        }

        axios.get(API_BASE_URL + '/api/portfolio', {
            headers: { Authorization: 'Bearer ' + token }
        })
        .then(response => {
            if (isMounted) {
                setStock(response.data);
                setError('');
                setLoading(false);
            }
        })
        .catch(err => {
            if (isMounted) {
                if (err.response?.status === 401) {
                    setError('Session expired or unauthorized. Please log in again.');
                } else {
                    setError(err.response?.data?.message || 'Failed to load portfolio.');
                }
                setLoading(false);
            }
        });

        return () => { isMounted = false; };
    }, [token]);

    function handleSymbolChange(event) {
        const newSymbol = event.target.value;
        setSymbol(newSymbol);

        if (!newSymbol.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            return;
        }

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(async () => {
            try {
                const res = await axios.get(API_BASE_URL + '/api/stock/suggestions/search?q=' + encodeURIComponent(newSymbol.trim()), {
                    headers: { Authorization: 'Bearer ' + token }
                });
                setSuggestions(res.data);
                setShowSuggestions(true);
            } catch {
                setSuggestions([]);
            }
        }, 200);
    }

    function handleFocus() {
        if (suggestions.length > 0) {
            setShowSuggestions(true);
        }
    }

    function handleBlur() {
        setTimeout(function() {
            setShowSuggestions(false);
        }, 200);
    }

    function handleSuggestionClick(selectedStock) {
        setSymbol(selectedStock.symbol);
        setShowSuggestions(false);
    }

    async function handleAdd(event) {
        event.preventDefault();

        if (!symbol.trim() || isAdding) {
            return;
        }

        setIsAdding(true);
        setError('');

        try {
            await axios.post(
                API_BASE_URL + '/api/portfolio/add',
                { symbol: symbol.trim().toUpperCase() },
                { headers: { Authorization: 'Bearer ' + token } }
            );

            setSymbol('');
            setSuggestions([]);
            setShowSuggestions(false);
            await loadPortfolio();
        } catch(err) {
            setError(err.response?.data?.message || 'Failed to add stock.');
        } finally {
            setIsAdding(false);
        }
    }

    // Instant optimistic removal for zero latency
    async function handleRemove(id) {
        if (removingId) return;
        setRemovingId(id);

        const previousStocks = [...stock];
        setStock(prev => prev.filter(item => item._id !== id));

        try {
            await axios.delete(
                API_BASE_URL + '/api/portfolio/' + id,
                { headers: { Authorization: 'Bearer ' + token } }
            );
        } catch {
            setStock(previousStocks); // rollback if failed
            setError('Failed to remove stock.');
        } finally {
            setRemovingId(null);
        }
    }

    return (
        <div className="fade-in" style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div className="page-header">
                <h1>Portfolio</h1>
                <p>Your saved stocks with live prices.</p>
            </div>

            <div className="search-wrapper" style={{ marginBottom: '2rem' }}>
                <form onSubmit={handleAdd} className="search-container">
                    <input
                        type="text"
                        className="input"
                        value={symbol}
                        onChange={handleSymbolChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholder="Add a symbol, e.g. AAPL, RELIANCE, TCS"
                        style={{flex: 1}}
                        disabled={isAdding}
                    />
                    <button type="submit" className="btn-primary" disabled={isAdding || !symbol.trim()}>
                        {isAdding ? 'Adding...' : 'Add'}
                    </button>
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

            {error && <p className="error-message" style={{textAlign: "center"}}>{error}</p>}

            {loading && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading portfolio...</p>
            )}

            {!loading && (
                <div className="portfolio-grid">
                    {stock.length === 0 && !error && (
                        <div className="empty-state">
                            <p>No stocks yet. Add a symbol above to start tracking.</p>
                        </div>
                    )}

                    {stock.map(function(item) {
                        return (
                            <div key={item._id} className="card portfolio-card">
                                <div className="stock-row">
                                    <h3>{item.symbol}</h3>
                                    {item.price !== undefined && item.price !== null && (
                                        <span className="stock-price">
                                            {item.currency === 'INR' ? '₹' : '$'}{item.price.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                                <button 
                                    className="btn-danger" 
                                    onClick={function() { handleRemove(item._id); }}
                                    disabled={removingId === item._id}
                                >
                                    {removingId === item._id ? 'Removing...' : 'Remove'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Portfolio;
