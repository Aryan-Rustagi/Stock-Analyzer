import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useClickOutside } from '../hooks/useClickOutside';

// Issue 3 fix: Toast notification component for success feedback and undo
function Toast({ message, onUndo, onDismiss }) {
    useEffect(function () {
        const timer = setTimeout(onDismiss, 4000);
        return function () { clearTimeout(timer); };
    }, [onDismiss]);

    return (
        <div className="toast fade-in">
            <span>{message}</span>
            {onUndo && (
                <button className="toast-undo" onClick={onUndo}>Undo</button>
            )}
        </div>
    );
}

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
    const [activeIndex, setActiveIndex] = useState(-1);
    const debounceTimerRef = useRef(null);

    // Issue 3 fix: toast / undo state
    const [toast, setToast] = useState(null);

    // Click-outside — fixes Issue 1 (blur timer)
    const wrapperRef = useRef(null);
    const closeSuggestions = useCallback(function () {
        setShowSuggestions(false);
        setActiveIndex(-1);
    }, []);
    useClickOutside(wrapperRef, closeSuggestions);

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

    useEffect(function () {
        let isMounted = true;
        if (!token) return;

        axios.get(API_BASE_URL + '/api/portfolio', {
            headers: { Authorization: 'Bearer ' + token }
        })
        .then(function (response) {
            if (isMounted) {
                setStock(response.data);
                setError('');
                setLoading(false);
            }
        })
        .catch(function (err) {
            if (isMounted) {
                if (err.response?.status === 401) {
                    setError('Session expired or unauthorized. Please log in again.');
                } else {
                    setError(err.response?.data?.message || 'Failed to load portfolio.');
                }
                setLoading(false);
            }
        });

        return function () { isMounted = false; };
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
        debounceTimerRef.current = setTimeout(async function () {
            try {
                const res = await axios.get(API_BASE_URL + '/api/stock/suggestions/search?q=' + encodeURIComponent(newSymbol.trim()), {
                    headers: { Authorization: 'Bearer ' + token }
                });
                setSuggestions(res.data);
                setShowSuggestions(true);
                setActiveIndex(-1);
            } catch {
                setSuggestions([]);
            }
        }, 200);
    }

    // Issue 2 fix: keyboard navigation
    function handleKeyDown(event) {
        if (!showSuggestions || suggestions.length === 0) return;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex(function (prev) { return Math.min(prev + 1, suggestions.length - 1); });
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex(function (prev) { return Math.max(prev - 1, -1); });
        } else if (event.key === 'Enter' && activeIndex >= 0) {
            event.preventDefault();
            handleSuggestionClick(suggestions[activeIndex]);
        } else if (event.key === 'Escape') {
            closeSuggestions();
        }
    }

    function handleSuggestionClick(selectedStock) {
        setSymbol(selectedStock.symbol);
        closeSuggestions();
    }

    async function handleAdd(event) {
        event.preventDefault();

        if (!symbol.trim() || isAdding) return;

        setIsAdding(true);
        setError('');

        try {
            await axios.post(
                API_BASE_URL + '/api/portfolio/add',
                { symbol: symbol.trim().toUpperCase() },
                { headers: { Authorization: 'Bearer ' + token } }
            );

            const addedSymbol = symbol.trim().toUpperCase();
            setSymbol('');
            setSuggestions([]);
            setShowSuggestions(false);
            await loadPortfolio();

            // Issue 7 fix: success toast after adding
            setToast({ type: 'add', message: `${addedSymbol} added to your portfolio.` });
        } catch(err) {
            setError(err.response?.data?.message || 'Failed to add stock.');
        } finally {
            setIsAdding(false);
        }
    }

    // Issue 3 fix: Optimistic removal with Undo
    async function handleRemove(id) {
        if (removingId) return;

        const removedItem = stock.find(function (item) { return item._id === id; });
        if (!removedItem) return;

        setRemovingId(id);
        const previousStocks = [...stock];
        setStock(function (prev) { return prev.filter(function (item) { return item._id !== id; }); });

        let undone = false;

        setToast({
            type: 'remove',
            message: `${removedItem.symbol} removed.`,
            onUndo: async function () {
                undone = true;
                setStock(previousStocks);
                setToast(null);
                setRemovingId(null);
            }
        });

        // Wait 4 seconds (toast duration) before actually deleting
        setTimeout(async function () {
            if (undone) return;
            try {
                await axios.delete(
                    API_BASE_URL + '/api/portfolio/' + id,
                    { headers: { Authorization: 'Bearer ' + token } }
                );
            } catch {
                setStock(previousStocks);
                setError('Failed to remove stock. Please try again.');
            } finally {
                setRemovingId(null);
            }
        }, 4000);
    }

    return (
        <div className="fade-in" style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div className="page-header">
                <h1>Portfolio</h1>
                <p>Your saved stocks with live prices.</p>
            </div>

            {/* Issue 1 & 2 fix: click-outside ref, keyboard navigation */}
            <div className="search-wrapper" style={{ marginBottom: '2rem' }} ref={wrapperRef}>
                <form onSubmit={handleAdd} className="search-container">
                    <input
                        type="text"
                        className="input"
                        value={symbol}
                        onChange={handleSymbolChange}
                        onFocus={function () { if (suggestions.length > 0) setShowSuggestions(true); }}
                        onKeyDown={handleKeyDown}
                        placeholder="Add a symbol, e.g. AAPL, RELIANCE, TCS"
                        style={{flex: 1}}
                        disabled={isAdding}
                        aria-autocomplete="list"
                        aria-expanded={showSuggestions && suggestions.length > 0}
                        role="combobox"
                        aria-activedescendant={activeIndex >= 0 ? `portfolio-suggestion-${activeIndex}` : undefined}
                    />
                    <button type="submit" className="btn-primary" disabled={isAdding || !symbol.trim()}>
                        {isAdding ? 'Adding...' : 'Add'}
                    </button>
                </form>

                {showSuggestions && suggestions.length > 0 && (
                    <div className="suggestions-dropdown" role="listbox">
                        {suggestions.map(function(s, idx) {
                            return (
                                <div
                                    id={`portfolio-suggestion-${idx}`}
                                    key={idx}
                                    className={'suggestion-item' + (idx === activeIndex ? ' suggestion-item--active' : '')}
                                    role="option"
                                    aria-selected={idx === activeIndex}
                                    onMouseDown={function() { handleSuggestionClick(s); }}
                                    onMouseEnter={function() { setActiveIndex(idx); }}
                                >
                                    <span className="suggestion-symbol">{s.symbol}</span>
                                    <span className="suggestion-name">{s.shortname} · {s.exchDisp}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {error && <p className="error-message" style={{textAlign: 'center'}}>{error}</p>}

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
                        // Issue 4 fix: show day change with correct green/red coloring
                        const isPositive = item.change !== undefined ? item.change >= 0 : null;
                        return (
                            <div key={item._id} className="card portfolio-card">
                                <div className="stock-row">
                                    <div>
                                        <h3 style={{margin: 0}}>{item.symbol}</h3>
                                        {item.companyName && (
                                            <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{item.companyName}</span>
                                        )}
                                    </div>
                                    <div style={{textAlign: 'right'}}>
                                        {item.price !== undefined && item.price !== null && (
                                            <span className="stock-price" style={{
                                                color: isPositive === null ? 'var(--text)' : isPositive ? 'var(--green)' : 'var(--red)'
                                            }}>
                                                {item.currency === 'INR' ? '₹' : '$'}{item.price.toFixed(2)}
                                            </span>
                                        )}
                                        {/* Day change */}
                                        {item.change !== undefined && item.change !== null && (
                                            <div style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: isPositive ? 'var(--green)' : 'var(--red)',
                                                marginTop: '0.1rem'
                                            }}>
                                                {isPositive ? '+' : ''}{item.change.toFixed(2)}
                                                {item.changePercent !== undefined && (
                                                    <> ({isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%)</>
                                                )}
                                            </div>
                                        )}
                                    </div>
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

            {/* Issue 3 & 7 fix: toast notification with optional undo */}
            {toast && (
                <Toast
                    message={toast.message}
                    onUndo={toast.onUndo}
                    onDismiss={function () { setToast(null); }}
                />
            )}
        </div>
    );
}

export default Portfolio;
