import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import About from './components/About'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import SearchStock from './pages/SearchStock'
import ProtectedRoute from './components/ProtectedRoute'
import Portfolio from './pages/Portfolio'

import './App.css'

function Navigation() {
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem('token');
  
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Stock Analyzer</Link>
      </div>
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/portfolio">Portfolio</Link>
        <Link to="/searchstock">Search</Link>
        {!isLoggedIn && <Link to="/login" className="btn-glow">Login</Link>}
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
          <p>&copy; 2026 Stock Analyzer. Built for modern investors.</p>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App