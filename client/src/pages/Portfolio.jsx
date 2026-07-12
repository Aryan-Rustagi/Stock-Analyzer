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
            setError('Failed to load portfolio');
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
            const res = await axios.get('https://stock-analyzer-api-n9mz.onrender.com/api/stock/suggestions/search?q='+ newSymbol, {
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
            loadPortfolio();
        } catch(err) {
            setError('Failed to add stock');
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
            setError('Failed to remove stock');
        }
    }

    return (
        <div className="animate-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
            <div style={{textAlign: "center", marginBottom: "2rem"}}>
                <p className="eyebrow">Your Investments</p>
                <h1>My Portfolio</h1>
            </div>


            <div className="search-wrapper" style={{ marginBottom: '3rem' }}>
                <form onSubmit={handleAdd} className="search-container">
                    <input
                        type="text"
                        className="glow-input"
                        value={symbol}
                        onChange={handleSymbolChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholder="Enter stock symbol (e.g. AAPL)"
                        style={{flex: 1}}
                    />
                    <button type="submit" className="btn-glow">Add Stock</button>
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

            {error && <p className="error-message" style={{textAlign: "center"}}>{error}</p>}


            {loading && (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading your portfolio...</p>
            )}


            {!loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    

                    {stock.length === 0 && !error && (
                        <div className="empty-state">
                            <div className="empty-state-icon">📈</div>
                            <p>Your portfolio is empty. Search and add stocks above to start tracking your investments.</p>
                        </div>
                    )}
                    

                    {stock.map(function(item, index) {
                        return (
                            <div key={item._id} className="glass-panel portfolio-card stagger-in" style={{ animationDelay: (index * 0.1) + 's' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{item.symbol}</h3>
                                    {item.price && <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>${item.price.toFixed(2)}</span>}
                                </div>
                                
                                <button className="btn-glow btn-glass" onClick={function() { handleRemove(item._id); }} style={{ marginTop: 'auto', color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}>
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