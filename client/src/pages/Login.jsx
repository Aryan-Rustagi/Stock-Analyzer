import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

function EyeIcon({ open }) {
    return open ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
    );
}

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    // Track which fields have been touched for inline validation cues
    const [touched, setTouched] = useState({ email: false, password: false });

    function markTouched(field) {
        setTouched(function (prev) { return { ...prev, [field]: true }; });
    }

    const emailInvalid = touched.email && email.trim() === '';
    const passwordInvalid = touched.password && password === '';

    async function handleSubmit(event) {
        event.preventDefault();
        setTouched({ email: true, password: true });

        if (email.trim() === '') { setError('Please enter your email.'); return; }
        if (password === '') { setError('Please enter your password.'); return; }

        setError('');
        setLoading(true);
        try {
            const response = await axios.post(API_BASE_URL + '/api/auth/login', {
                email: email.trim(),
                password,
            });
            login(response.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-container">
            <motion.div
                className="auth-card card"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                <h1>Sign in</h1>
                <p className="subtitle">Enter your credentials to continue.</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="login-email" className="form-label">Email</label>
                        <input
                            id="login-email"
                            className={'input' + (emailInvalid ? ' input--error' : '')}
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={function (e) { setEmail(e.target.value); }}
                            onBlur={function () { markTouched('email'); }}
                            disabled={loading}
                            autoComplete="email"
                        />
                        {emailInvalid && <span className="field-error">Email is required.</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="login-password" className="form-label">Password</label>
                        {/* Fix #9: password visibility toggle */}
                        <div className="input-password-wrap">
                            <input
                                id="login-password"
                                className={'input' + (passwordInvalid ? ' input--error' : '')}
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Your password"
                                value={password}
                                onChange={function (e) { setPassword(e.target.value); }}
                                onBlur={function () { markTouched('password'); }}
                                disabled={loading}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={function () { setShowPassword(function (v) { return !v; }); }}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                tabIndex={-1}
                            >
                                <EyeIcon open={showPassword} />
                            </button>
                        </div>
                        {passwordInvalid && <span className="field-error">Password is required.</span>}
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', marginTop: '0.5rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>

                <AnimatePresence>
                    {error && (
                        <motion.p
                            className="auth-error"
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>

                <p className="auth-link">
                    No account? <Link to="/signup">Create one</Link>
                </p>
            </motion.div>
        </div>
    );
}

export default Login;
