import { useState, useEffect } from 'react';
import axios from 'axios';

function Portfolio() {
    const [stock, setStock] = useState([]);
    const [symbol, setSymbol] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const token = localStorage.getItem('token');

    async function loadPortfolio() {
        setLoading(true);
        try {
            const response = await axios.get(
                'https://stock-analyzer-api-n9mz.onrender.com/api/portfolio',
                { headers: { Authorization: 'Bearer ' + token } }
            );
            setStock(response.data);
        } catch(err) {
            setError('Failed to load portfolio.');
        }
        setLoading(false);
    }

    useEffect(function() {
        loadPortfolio();
    }, []);

    async function handleSymbolChange(event) {
        const newSymbol = event.target.value;
        setSymbol(newSymbol);

        if (newSymbol === '') {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            const res = await axios.get('https://stock-analyzer-api-n9mz.onrender.com/api/stock/suggestions/search?q=' + newSymbol, {
                headers: { Authorization: 'Bearer ' + token }
            });
            setSuggestions(res.data);
            setShowSuggestions(true);
        } catch (err) {
            setSuggestions([]);
        }
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

        if (symbol === '') {
            return;
        }

        try {
            await axios.post(
                'https://stock-analyzer-api-n9mz.onrender.com/api/portfolio/add',
                { symbol: symbol.toUpperCase() },
                { headers: { Authorization: 'Bearer ' + token } }
            );

            setSymbol('');
            setSuggestions([]);
            setError('');
            loadPortfolio();
        } catch(err) {
            setError(err.response?.data?.message || 'Failed to add stock.');
        }
    }

    async function handleRemove(id) {
        try {
            await axios.delete(
                'https://stock-analyzer-api-n9mz.onrender.com/api/portfolio/' + id,
                { headers: { Authorization: 'Bearer ' + token } }
            );
            loadPortfolio();
        } catch(err) {
            setError('Failed to remove stock.');
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
                        placeholder="Add a symbol, e.g. AAPL"
                        style={{flex: 1}}
                    />
                    <button type="submit" className="btn-primary">Add</button>
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
                                    {item.price && (
                                        <span className="stock-price">${item.price.toFixed(2)}</span>
                                    )}
                                </div>
                                <button className="btn-danger" onClick={function() { handleRemove(item._id); }}>
                                    Remove
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