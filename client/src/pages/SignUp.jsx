import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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

    if (name === '') {
      setError('Please enter your name.');
      setMessage('');
    } else if (email === '') {
      setError('Please enter your email.');
      setMessage('');
    } else if (password === '') {
      setError('Please enter your password.');
      setMessage('');
    } else if (confirmPassword === '') {
      setError('Please confirm your password.');
      setMessage('');
    } else if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setMessage('');
    } else {
      setError('');

      try {
        const response = await axios.post('https://stock-analyzer-api-n9mz.onrender.com/api/auth/register', {
          name: name,
          email: email,
          password: password
        });

        localStorage.setItem('token', response.data.token);
        alert('Registration successful!');
        navigate('/dashboard');
      }
      catch(err) {
        setError(err.response?.data?.message || 'Registration failed');
      }
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel animate-in">
        <div className="auth-intro">
          <p className="eyebrow">Create account</p>
          <h1>Begin your investment journey</h1>
          <p>Register today and make informed decisions with a clear outlook on your portfolio.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="signup-name" className="form-label">Full name</label>
            <input
              id="signup-name"
              className="glow-input"
            type="text"
            placeholder="Enter your name"
            value={name}
              onChange={handleNameChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-email" className="form-label">Email address</label>
            <input
              id="signup-email"
              className="glow-input"
            type="email"
            placeholder="Enter your email"
            value={email}
              onChange={handleEmailChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-password" className="form-label">Password</label>
            <input
              id="signup-password"
              className="glow-input"
            type="password"
            placeholder="Enter your password"
            value={password}
              onChange={handlePasswordChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-confirm" className="form-label">Confirm password</label>
            <input
              id="signup-confirm"
              className="glow-input"
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
              onChange={handleConfirmPasswordChange}
            />
          </div>

          <button type="submit" className="btn-glow" style={{width: "100%", marginTop: "1rem"}}>Create account</button>
        </form>

        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-success">{message}</p>}

        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default SignUp;