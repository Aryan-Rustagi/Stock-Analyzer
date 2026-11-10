import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

const SAMPLE_QUESTIONS = [
    'What is a P/E ratio?',
    'How do I diversify a portfolio?',
    'What is dollar-cost averaging?'
];

// Issue 5 fix: render AI response with simple markdown-like formatting
function FormattedAnswer({ text }) {
    if (!text) return null;

    // Split on double-newlines for paragraphs, then handle bullet points
    const paragraphs = text.split(/\n{2,}/);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {paragraphs.map(function (para, i) {
                const lines = para.split('\n');
                // If the paragraph looks like a bullet list
                const isBulletBlock = lines.every(function (l) {
                    return l.trimStart().startsWith('-') || l.trimStart().startsWith('•') || l.trimStart().startsWith('*') || l.trim() === '';
                });

                if (isBulletBlock) {
                    return (
                        <ul key={i} style={{ paddingLeft: '1.25rem', margin: 0 }}>
                            {lines.filter(function (l) { return l.trim(); }).map(function (line, j) {
                                return (
                                    <li key={j} style={{ fontSize: '0.92rem', lineHeight: '1.75', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                        {line.replace(/^[\s\-•*]+/, '')}
                                    </li>
                                );
                            })}
                        </ul>
                    );
                }

                return (
                    <p key={i} style={{ fontSize: '0.92rem', lineHeight: '1.75', color: 'var(--text-secondary)', margin: 0 }}>
                        {para}
                    </p>
                );
            })}
        </div>
    );
}

function Dashboard() {
    const navigate = useNavigate();
    const { token, logout } = useAuth();

    // Issue 5 fix: conversation thread instead of single-response overwrite
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState([]); // [{ role: 'user'|'assistant'|'error', text }]
    const [chatLoading, setChatLoading] = useState(false);

    function handleLogout() {
        logout();
        navigate('/');
    }

    async function askQuestion(q) {
        const text = (q || question).trim();
        if (!text || chatLoading) return;

        setMessages(function (prev) { return [...prev, { role: 'user', text: text }]; });
        setQuestion('');
        setChatLoading(true);

        try {
            const res = await axios.post(
                API_BASE_URL + '/api/ai/chat',
                { question: text },
                { headers: { Authorization: 'Bearer ' + token } }
            );
            setMessages(function (prev) {
                return [...prev, { role: 'assistant', text: res.data.answer, disclaimer: res.data.disclaimer }];
            });
        } catch (err) {
            setMessages(function (prev) {
                return [...prev, { role: 'error', text: err.response?.data?.message || 'Chat failed. Please try again.' }];
            });
        } finally {
            setChatLoading(false);
        }
    }

    function handleSubmit(event) {
        event.preventDefault();
        askQuestion(question);
    }

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

            {/* AI Finance Chat Widget — Issue 5 fix: conversation thread */}
            <div className="card" style={{ marginTop: '2.5rem', maxWidth: '680px', margin: '2.5rem auto 0', padding: '1.5rem' }}>
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
                                disabled={chatLoading}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid #2a2a2a',
                                    color: 'var(--text-muted)',
                                    padding: '0.3rem 0.75rem',
                                    borderRadius: '999px',
                                    fontSize: '0.78rem',
                                    cursor: chatLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {q}
                            </button>
                        );
                    })}
                </div>

                {/* Conversation thread */}
                {messages.length > 0 && (
                    <div style={{
                        maxHeight: '360px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        marginBottom: '1rem',
                        paddingRight: '0.25rem'
                    }}>
                        {messages.map(function (msg, i) {
                            if (msg.role === 'user') {
                                return (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <span style={{
                                            background: 'var(--bg-input)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '8px 8px 2px 8px',
                                            padding: '0.5rem 0.875rem',
                                            fontSize: '0.875rem',
                                            color: 'var(--text)',
                                            maxWidth: '80%'
                                        }}>
                                            {msg.text}
                                        </span>
                                    </div>
                                );
                            }
                            if (msg.role === 'error') {
                                return (
                                    <div key={i}>
                                        <p className="error-message">{msg.text}</p>
                                    </div>
                                );
                            }
                            // assistant
                            return (
                                <div key={i} style={{
                                    background: 'var(--bg-hover)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '2px 8px 8px 8px',
                                    padding: '0.75rem 0.875rem'
                                }}>
                                    <FormattedAnswer text={msg.text} />
                                    {msg.disclaimer && (
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.5rem', marginBottom: 0 }}>
                                            {msg.disclaimer}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                        {chatLoading && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Thinking...</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Input */}
                <form onSubmit={handleSubmit} className="search-container">
                    <input
                        type="text"
                        className="input"
                        value={question}
                        onChange={function(e) { setQuestion(e.target.value); }}
                        placeholder="e.g. What is a stock split?"
                        style={{ flex: 1 }}
                        disabled={chatLoading}
                    />
                    <button type="submit" className="btn-primary" disabled={chatLoading || !question.trim()}>
                        {chatLoading ? '...' : 'Ask'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Dashboard;
