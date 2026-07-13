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

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/');
    window.location.reload();
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Stock Analyzer</Link>
      </div>
      <div className="navbar-links">
        <Link to="/">Home</Link>
        {isLoggedIn && <Link to="/dashboard">Dashboard</Link>}
        {isLoggedIn && <Link to="/portfolio">Portfolio</Link>}
        {isLoggedIn && <Link to="/searchstock">Search</Link>}
        {isLoggedIn ? (
          <button className="btn-primary" onClick={handleLogout}>Logout</button>
        ) : (
          <Link to="/login"><button className="btn-primary">Sign In</button></Link>
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
          <p>&copy; 2026 Stock Analyzer</p>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App