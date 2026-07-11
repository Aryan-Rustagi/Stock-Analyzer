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
                const response = await axios.post('http://localhost:5000/api/auth/login', {
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
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-intro">
                    <p className="eyebrow">Welcome back</p>
                    <h1>Login to your account</h1>
                    <p>Continue your investment journey with Stock Analyzer.</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <label htmlFor="login-email">Email address</label>
                    <input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={handleEmailChange}
                    />

                    <label htmlFor="login-password">Password</label>
                    <input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={handlePasswordChange}
                    />

                    <button type="submit">Login</button>
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