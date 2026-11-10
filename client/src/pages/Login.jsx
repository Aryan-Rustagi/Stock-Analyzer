import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handleEmailChange(event) {
        setEmail(event.target.value);
    }

    function handlePasswordChange(event) {
        setPassword(event.target.value);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (email === '') {
            setError('Please enter your email.');
            return;
        }
        if (password === '') {
            setError('Please enter your password.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const response = await axios.post(API_BASE_URL + '/api/auth/login', {
                email: email.trim(),
                password: password
            });

            login(response.data.token);
            navigate('/dashboard');
        } catch(err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card card fade-in">
                <h1>Sign in</h1>
                <p className="subtitle">Enter your credentials to continue.</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="login-email" className="form-label">Email</label>
                        <input
                            id="login-email"
                            className="input"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={handleEmailChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="login-password" className="form-label">Password</label>
                        <input
                            id="login-password"
                            className="input"
                            type="password"
                            placeholder="Your password"
                            value={password}
                            onChange={handlePasswordChange}
                            disabled={loading}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn-primary" 
                        style={{width: "100%", marginTop: "0.5rem"}}
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                {error && <p className="auth-error">{error}</p>}

                <p className="auth-link">
                    No account? <Link to="/signup">Create one</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
