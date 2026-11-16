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

function PasswordStrength({ password }) {
    if (!password) return null;
    const strength = password.length >= 12 ? 3 : password.length >= 8 ? 2 : password.length >= 6 ? 1 : 0;
    const labels = ['Too short', 'Weak', 'Fair', 'Strong'];
    const colors = ['var(--red)', 'var(--red)', '#f59e0b', 'var(--green)'];
    return (
        <div style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '3px', marginBottom: '0.3rem' }}>
                {[0, 1, 2].map(function (i) {
                    return (
                        <div key={i} style={{
                            height: '3px',
                            flex: 1,
                            borderRadius: '2px',
                            background: i < strength ? colors[strength] : 'var(--border)',
                            transition: 'background 0.3s ease',
                        }} />
                    );
                })}
            </div>
            <span style={{ fontSize: '0.72rem', color: colors[strength] }}>{labels[strength]}</span>
        </div>
    );
}

function SignUp() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState({ name: false, email: false, password: false, confirm: false });

    function markTouched(field) {
        setTouched(function (prev) { return { ...prev, [field]: true }; });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setTouched({ name: true, email: true, password: true, confirm: true });

        if (name.trim() === '') { setError('Please enter your name.'); return; }
        if (email.trim() === '') { setError('Please enter your email.'); return; }
        if (password === '') { setError('Please enter a password.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

        setError('');
        setLoading(true);
        try {
            const response = await axios.post(API_BASE_URL + '/api/auth/register', {
                name: name.trim(),
                email: email.trim(),
                password,
            });
            login(response.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
                <h1>Create account</h1>
                <p className="subtitle">Start tracking your investments today.</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="signup-name" className="form-label">Name</label>
                        <input
                            id="signup-name"
                            className={'input' + (touched.name && name.trim() === '' ? ' input--error' : '')}
                            type="text"
                            placeholder="Your full name"
                            value={name}
                            onChange={function (e) { setName(e.target.value); }}
                            onBlur={function () { markTouched('name'); }}
                            disabled={loading}
                            autoComplete="name"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="signup-email" className="form-label">Email</label>
                        <input
                            id="signup-email"
                            className={'input' + (touched.email && email.trim() === '' ? ' input--error' : '')}
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={function (e) { setEmail(e.target.value); }}
                            onBlur={function () { markTouched('email'); }}
                            disabled={loading}
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="signup-password" className="form-label">Password</label>
                        <div className="input-password-wrap">
                            <input
                                id="signup-password"
                                className={'input' + (touched.password && password.length < 6 && password !== '' ? ' input--error' : '')}
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Min. 6 characters"
                                value={password}
                                onChange={function (e) { setPassword(e.target.value); }}
                                onBlur={function () { markTouched('password'); }}
                                disabled={loading}
                                autoComplete="new-password"
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
                        {/* Fix #9: password strength indicator */}
                        {password && <PasswordStrength password={password} />}
                    </div>

                    <div className="form-group">
                        <label htmlFor="signup-confirm" className="form-label">Confirm password</label>
                        <div className="input-password-wrap">
                            <input
                                id="signup-confirm"
                                className={'input' + (touched.confirm && confirmPassword && confirmPassword !== password ? ' input--error' : '')}
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="Repeat your password"
                                value={confirmPassword}
                                onChange={function (e) { setConfirmPassword(e.target.value); }}
                                onBlur={function () { markTouched('confirm'); }}
                                disabled={loading}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={function () { setShowConfirm(function (v) { return !v; }); }}
                                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                tabIndex={-1}
                            >
                                <EyeIcon open={showConfirm} />
                            </button>
                        </div>
                        {touched.confirm && confirmPassword && confirmPassword !== password && (
                            <span className="field-error">Passwords do not match.</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', marginTop: '0.5rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Creating account…' : 'Create account'}
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
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </motion.div>
        </div>
    );
}

export default SignUp;
