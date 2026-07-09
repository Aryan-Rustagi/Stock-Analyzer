import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <h4>Stock Analyzer</h4>
        <p>Empowering smarter investment decisions with dependable market perspective.</p>
      </div>

      <div className="footer-links">
        <Link to="/about">About</Link>
        <Link to="/login">Login</Link>
        <Link to="/signup">Sign Up</Link>
        <a href="https://github.com/Aryan-Rustagi" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </div>
    </footer>
  );
}

export default Footer;