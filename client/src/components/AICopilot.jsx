import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

const SAMPLE_QUESTIONS = [
    'What is a P/E ratio?',
    'How do I diversify a portfolio?',
    'What is dollar-cost averaging?',
    'Explain market cap vs enterprise value'
];

function FormattedAnswer({ text }) {
    if (!text) return null;

    const paragraphs = text.split(/\n{2,}/);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {paragraphs.map(function (para, i) {
                const lines = para.split('\n');
                const isBulletBlock = lines.every(function (l) {
                    return l.trimStart().startsWith('-') || l.trimStart().startsWith('•') || l.trimStart().startsWith('*') || l.trim() === '';
                });

                if (isBulletBlock) {
                    return (
                        <ul key={i} style={{ paddingLeft: '1.15rem', margin: 0 }}>
                            {lines.filter(function (l) { return l.trim(); }).map(function (line, j) {
                                return (
                                    <li key={j} style={{ fontSize: '0.84rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                                        {line.replace(/^[\s\-•*]+/, '')}
                                    </li>
                                );
                            })}
                        </ul>
                    );
                }

                return (
                    <p key={i} style={{ fontSize: '0.84rem', lineHeight: '1.6', color: 'var(--text-secondary)', margin: 0 }}>
                        {para}
                    </p>
                );
            })}
        </div>
    );
}

function AICopilot() {
    const { token, isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            text: 'Hello! I am your AI Finance Assistant. Ask me any investing, stock market, or financial concept question.',
            disclaimer: ''
        }
    ]);
    const [chatLoading, setChatLoading] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom of conversation
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, chatLoading, isOpen]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen]);

    // Don't render floating widget if user is not authenticated
    if (!isAuthenticated) return null;

    async function askQuestion(q) {
        const text = (q || question).trim();
        if (!text || chatLoading) return;

        setMessages((prev) => [...prev, { role: 'user', text }]);
        setQuestion('');
        setChatLoading(true);

        try {
            const authToken = token || localStorage.getItem('token');
            const res = await axios.post(
                API_BASE_URL + '/api/ai/chat',
                { question: text },
                { headers: { Authorization: 'Bearer ' + authToken } }
            );
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', text: res.data.answer, disclaimer: res.data.disclaimer }
            ]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { role: 'error', text: err.response?.data?.message || 'Chat service unavailable. Please try again.' }
            ]);
        } finally {
            setChatLoading(false);
        }
    }

    function handleSubmit(e) {
        e.preventDefault();
        askQuestion(question);
    }

    function handleSampleClick(sample) {
        setQuestion(sample);
        askQuestion(sample);
    }

    return (
        <aside aria-label="AI Finance Copilot">
            {/* Floating Trigger Pill */}
            <motion.button
                type="button"
                className="ai-copilot-trigger"
                onClick={() => setIsOpen((prev) => !prev)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                aria-label={isOpen ? 'Close AI Finance Copilot' : 'Open AI Finance Copilot'}
                aria-expanded={isOpen}
            >
                <span className="ai-copilot-dot" />
                <span style={{ fontWeight: 600, fontSize: '0.82rem', letterSpacing: '-0.01em' }}>
                    ✦ AI Copilot
                </span>
            </motion.button>

            {/* Floating Chat Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="ai-copilot-panel card"
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.96 }}
                        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        {/* Header */}
                        <div className="ai-copilot-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.85rem' }}>
                                    ✦ AI Finance Assistant
                                </span>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    fontSize: '0.68rem',
                                    color: '#22c55e',
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '999px',
                                    border: '1px solid rgba(34, 197, 94, 0.25)'
                                }}>
                                    ● Online
                                </span>
                            </div>
                            <button
                                type="button"
                                className="ai-copilot-close"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Quick Sample Questions (shown when thread is short) */}
                        {messages.length <= 2 && (
                            <div className="ai-copilot-samples">
                                {SAMPLE_QUESTIONS.map((q, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleSampleClick(q)}
                                        disabled={chatLoading}
                                        className="ai-copilot-chip"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Conversation Thread */}
                        <div className="ai-copilot-messages">
                            {messages.map((msg, i) => {
                                if (msg.role === 'user') {
                                    return (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <div className="ai-bubble-user">
                                                {msg.text}
                                            </div>
                                        </div>
                                    );
                                }
                                if (msg.role === 'error') {
                                    return (
                                        <div key={i} className="error-message" style={{ fontSize: '0.8rem', margin: 0 }}>
                                            {msg.text}
                                        </div>
                                    );
                                }
                                return (
                                    <div key={i} className="ai-bubble-assistant">
                                        <FormattedAnswer text={msg.text} />
                                        {msg.disclaimer && (
                                            <p style={{
                                                fontSize: '0.72rem',
                                                color: 'var(--text-muted)',
                                                fontStyle: 'italic',
                                                marginTop: '0.4rem',
                                                marginBottom: 0
                                            }}>
                                                {msg.disclaimer}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}

                            {chatLoading && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        ✦ AI is thinking...
                                    </span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSubmit} className="ai-copilot-input-bar">
                            <input
                                ref={inputRef}
                                type="text"
                                className="input"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Ask any financial question..."
                                style={{ flex: 1, fontSize: '0.84rem', padding: '0.5rem 0.75rem' }}
                                disabled={chatLoading}
                            />
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={chatLoading || !question.trim()}
                                style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem' }}
                            >
                                {chatLoading ? '...' : 'Ask'}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </aside>
    );
}

export default AICopilot;
