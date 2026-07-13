import { useState } from 'react'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import About from './components/About'
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import SearchStock from './pages/SearchStock'
import ProtectedRoute from './components/ProtectedRoute'
import Portfolio from './pages/Portfolio'

import './App.css'

function Navigation() {
  const isLoggedIn = !!localStorage.getItem('token');
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/');
    window.location.reload();
  }

  function toggleMenu() {
    setIsMenuOpen(!isMenuOpen);
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" onClick={closeMenu}>Stock Analyzer</Link>
      </div>
      
      <div className="mobile-menu-icon" onClick={toggleMenu}>
        {isMenuOpen ? '✕' : '☰'}
      </div>

      <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
        <Link to="/" onClick={closeMenu}>Home</Link>
        {isLoggedIn && <Link to="/dashboard" onClick={closeMenu}>Dashboard</Link>}
        {isLoggedIn && <Link to="/portfolio" onClick={closeMenu}>Portfolio</Link>}
        {isLoggedIn && <Link to="/searchstock" onClick={closeMenu}>Search</Link>}
        {isLoggedIn ? (
          <button className="btn-primary" onClick={() => { handleLogout(); closeMenu(); }}>Logout</button>
        ) : (
          <Link to="/login" onClick={closeMenu}><button className="btn-primary">Sign In</button></Link>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path='/' element={<LandingPage />} />
            <Route path='/login' element={<Login />} />
            <Route path='/signup' element={<SignUp />} />
            <Route path='/about' element={<About />} />
            <Route element={<ProtectedRoute />}>
              <Route path='/dashboard' element={<Dashboard/>}/>
              <Route path='/searchstock' element={<SearchStock/>}/>
              <Route path='/portfolio' element={<Portfolio/>}/>
            </Route>
          </Routes>
        </main>
        <footer className="footer">
          <p>&copy; 2026 Stock Analyzer. Made by Aryan Rustagi.</p>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App