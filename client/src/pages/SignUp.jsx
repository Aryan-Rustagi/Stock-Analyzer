import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

function SignUp() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleNameChange(event) {
    setName(event.target.value);
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);
  }

  function handleConfirmPasswordChange(event) {
    setConfirmPassword(event.target.value);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (name.trim() === '') {
      setError('Please enter your name.');
      return;
    }
    if (email.trim() === '') {
      setError('Please enter your email.');
      return;
    }
    if (password === '') {
      setError('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (confirmPassword === '') {
      setError('Please confirm your password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await axios.post(API_BASE_URL + '/api/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password: password
      });

      login(response.data.token);
      navigate('/dashboard');
    } catch(err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card card fade-in">
        <h1>Create account</h1>
        <p className="subtitle">Start tracking your investments today.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="signup-name" className="form-label">Name</label>
            <input
              id="signup-name"
              className="input"
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={handleNameChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-email" className="form-label">Email</label>
            <input
              id="signup-email"
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={handleEmailChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-password" className="form-label">Password</label>
            <input
              id="signup-password"
              className="input"
              type="password"
              placeholder="Create a password (min 6 characters)"
              value={password}
              onChange={handlePasswordChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-confirm" className="form-label">Confirm password</label>
            <input
              id="signup-confirm"
              className="input"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{width: "100%", marginTop: "0.5rem"}}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        {error && <p className="auth-error">{error}</p>}

        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
