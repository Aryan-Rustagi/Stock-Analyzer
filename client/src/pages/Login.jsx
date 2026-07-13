import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

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

        try {
            const response = await axios.post('https://stock-analyzer-api-n9mz.onrender.com/api/auth/login', {
                email: email,
                password: password
            });

            localStorage.setItem('token', response.data.token);
            navigate('/dashboard');
            window.location.reload();
        } catch(err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
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
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{width: "100%", marginTop: "0.5rem"}}>Sign in</button>
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