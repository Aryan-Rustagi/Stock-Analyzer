import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
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
        {isAuthenticated && <Link to="/dashboard" onClick={closeMenu}>Dashboard</Link>}
        {isAuthenticated && <Link to="/portfolio" onClick={closeMenu}>Portfolio</Link>}
        {isAuthenticated && <Link to="/searchstock" onClick={closeMenu}>Search</Link>}
        {isAuthenticated ? (
          <button className="btn-primary" onClick={() => { handleLogout(); closeMenu(); }}>Logout</button>
        ) : (
          <Link to="/login" onClick={closeMenu}><button className="btn-primary">Sign In</button></Link>
        )}
      </div>
    </nav>
  );
}

function PageLoader() {
  return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
      Loading...
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
                  <Route path='/dashboard' element={<Dashboard/>}/>
                  <Route path='/searchstock' element={<SearchStock/>}/>
                  <Route path='/portfolio' element={<Portfolio/>}/>
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
