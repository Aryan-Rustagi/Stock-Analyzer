import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="top-nav">
      <div className="brand-mark">
        <span className="brand-icon">S</span>
        <div>
          <h2>Stock Analyzer</h2>
          <p>Professional market insights</p>
        </div>
      </div>

      <ul className="nav-links">
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
        <li>
          <Link to="/login">Login</Link>
        </li>
        <li>
          <Link to="/signup" className="nav-cta">
            Sign Up
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;