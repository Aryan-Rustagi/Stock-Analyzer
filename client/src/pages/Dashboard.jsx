import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Sample questions to help the user get started
var SAMPLE_QUESTIONS = [
    'What is a P/E ratio?',
    'How do I diversify a portfolio?',
    'What is dollar-cost averaging?'
];

function Dashboard() {
    var navigate = useNavigate();

    // Chat state
    var [question, setQuestion] = useState('');
    var [chatResponse, setChatResponse] = useState(null);
    var [chatLoading, setChatLoading] = useState(false);
    var [chatError, setChatError] = useState('');

    function handleLogout() {
        localStorage.removeItem('token');
        navigate('/');
        window.location.reload();
    }

    // Closure: askQuestion captures the current `question` state and token from enclosing scope
    async function askQuestion(q) {
        var text = (q || question).trim();
        if (!text) return;

        setChatLoading(true);
        setChatError('');
        setChatResponse(null);

        try {
            var token = localStorage.getItem('token');
            var res = await axios.post(
                API_BASE_URL + '/api/ai/chat',
                { question: text },
                { headers: { Authorization: 'Bearer ' + token } }
            );
            setChatResponse(res.data);
        } catch (err) {
            setChatError(err.response?.data?.message || 'Chat failed. Please try again.');
        }

        setChatLoading(false);
    }

    function handleSubmit(event) {
        event.preventDefault();
        askQuestion(question);
    }

    // Closure: handleSampleClick closes over the sample string and calls askQuestion
    function handleSampleClick(sample) {
        setQuestion(sample);
        askQuestion(sample);
    }

    return (
        <div className="fade-in">
            <div className="dashboard-greeting">
                <h1>Dashboard</h1>
                <p>What would you like to do today?</p>
            </div>

            <div className="dashboard-cards">
                <Link to="/searchstock" className="dashboard-card">
                    <div className="dashboard-card-icon">↗</div>
                    <div>
                        <h3>Search Stocks</h3>
                        <p>Look up any stock by symbol. Get real-time prices, market data, and historical charts.</p>
                    </div>
                </Link>

                <Link to="/portfolio" className="dashboard-card">
                    <div className="dashboard-card-icon">◉</div>
                    <div>
                        <h3>My Portfolio</h3>
                        <p>Track your saved stocks in one place. Monitor live prices across your holdings.</p>
                    </div>
                </Link>

                <div className="dashboard-card" onClick={handleLogout}>
                    <div className="dashboard-card-icon">→</div>
                    <div>
                        <h3>Sign Out</h3>
                        <p>Log out of your account. Your portfolio will be saved.</p>
                    </div>
                </div>
            </div>

            {/* AI Finance Chat Widget */}
            <div className="card" style={{ marginTop: '2.5rem', maxWidth: '680px', margin: '2.5rem auto 0' }}>
                <h3 style={{ marginBottom: '0.4rem' }}>✦ AI Finance Assistant</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    Ask any investing or stock market question.
                </p>

                {/* Sample questions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {SAMPLE_QUESTIONS.map(function(q, i) {
                        return (
                            <button
                                key={i}
                                onClick={function() { handleSampleClick(q); }}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid #2a2a2a',
                                    color: 'var(--text-muted)',
                                    padding: '0.3rem 0.75rem',
                                    borderRadius: '999px',
                                    fontSize: '0.78rem',
                                    cursor: 'pointer'
                                }}
                            >
                                {q}
                            </button>
                        );
                    })}
                </div>

                <form onSubmit={handleSubmit} className="search-container" style={{ marginBottom: '1rem' }}>
                    <input
                        type="text"
                        className="input"
                        value={question}
                        onChange={function(e) { setQuestion(e.target.value); }}
                        placeholder="e.g. What is a stock split?"
                        style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn-primary" disabled={chatLoading || !question.trim()}>
                        {chatLoading ? '...' : 'Ask'}
                    </button>
                </form>

                {chatError && (
                    <p className="error-message">{chatError}</p>
                )}

                {chatLoading && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
                        Thinking...
                    </p>
                )}

                {chatResponse && (
                    <div className="fade-in" style={{ borderTop: '1px solid #1f1f1f', paddingTop: '1rem' }}>
                        <p style={{ fontSize: '0.92rem', lineHeight: '1.75', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            {chatResponse.answer}
                        </p>
                        {chatResponse.disclaimer && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                {chatResponse.disclaimer}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;