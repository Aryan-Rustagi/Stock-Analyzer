import { useState } from "react";
import { Link } from "react-router-dom";
import axios from 'axios';
import { useNavigate } from "react-router-dom";

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    function handleEmailChange(event) {
        setEmail(event.target.value);
    }

    function handlePasswordChange(event) {
        setPassword(event.target.value);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (email === '') {
            setError('Please enter the email');
            setMessage('');
        } else if (password === '') {
            setError('Please enter the password');
            setMessage('');
        } else {
            setError('');
            setMessage('');

            try {
                const response = await axios.post('https://stock-analyzer-api-n9mz.onrender.com/api/auth/login', {
                    email: email,
                    password: password
                });

                localStorage.setItem('token', response.data.token);
                alert('Login successful!');
                navigate('/dashboard');
            }
            catch(err) {
                setError(err.response?.data?.message || 'Login failed');
                setMessage('');
            }
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card glass-panel animate-in">
                <div className="auth-intro">
                    <p className="eyebrow">Welcome back</p>
                    <h1>Login to your account</h1>
                    <p>Continue your investment journey with Stock Analyzer.</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="login-email" className="form-label">Email address</label>
                        <input
                            id="login-email"
                            className="glow-input"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={handleEmailChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="login-password" className="form-label">Password</label>
                        <input
                            id="login-password"
                            className="glow-input"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={handlePasswordChange}
                        />
                    </div>

                    <button type="submit" className="btn-glow" style={{width: "100%", marginTop: "1rem"}}>Login</button>
                </form>

                {error && <p className="auth-error">{error}</p>}
                {message && <p className="auth-success">{message}</p>}

                <p className="auth-link">
                    Don't have an account? <Link to="/signup">Sign Up</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;