import { lazy, Suspense, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const Login = lazy(() => import('./pages/Login'))
const SignUp = lazy(() => import('./pages/SignUp'))
const About = lazy(() => import('./components/About'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const SearchStock = lazy(() => import('./pages/SearchStock'))
const Portfolio = lazy(() => import('./pages/Portfolio'))

function Navigation() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  // Fix #8: close mobile nav on Escape key
  useEffect(function () {
    function onKeyDown(e) {
      if (e.key === 'Escape' && isMenuOpen) closeMenu();
    }
    document.addEventListener('keydown', onKeyDown);
    return function () { document.removeEventListener('keydown', onKeyDown); };
  }, [isMenuOpen]);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/" onClick={closeMenu}>Stock Analyzer</Link>
        </div>

        <button
          className="mobile-menu-icon"
          onClick={function () { setIsMenuOpen(function (v) { return !v; }); }}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>

        <div className={`navbar-links${isMenuOpen ? ' active' : ''}`}>
          <Link to="/" onClick={closeMenu}>Home</Link>
          {isAuthenticated && <Link to="/dashboard" onClick={closeMenu}>Dashboard</Link>}
          {isAuthenticated && <Link to="/portfolio" onClick={closeMenu}>Portfolio</Link>}
          {isAuthenticated && <Link to="/searchstock" onClick={closeMenu}>Search</Link>}
          {isAuthenticated ? (
            <button className="btn-primary" onClick={function () { handleLogout(); closeMenu(); }}>Logout</button>
          ) : (
            <Link to="/login" onClick={closeMenu}><button className="btn-primary">Sign In</button></Link>
          )}
        </div>
      </nav>

      {/* Fix #8: backdrop overlay — tapping it closes the drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeMenu}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  );
}

function PageLoader() {
  return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
      Loading…
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navigation />
          <main className="main-content">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path='/' element={<LandingPage />} />
                <Route path='/login' element={<Login />} />
                <Route path='/signup' element={<SignUp />} />
                <Route path='/about' element={<About />} />
                <Route element={<ProtectedRoute />}>
                  <Route path='/dashboard' element={<Dashboard />} />
                  <Route path='/searchstock' element={<SearchStock />} />
                  <Route path='/portfolio' element={<Portfolio />} />
                </Route>
              </Routes>
            </Suspense>
          </main>
          <footer className="footer">
            <p>&copy; 2026 Stock Analyzer. Made by Aryan Rustagi.</p>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
