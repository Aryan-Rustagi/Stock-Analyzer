import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import About from './components/About'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import SearchStock from './pages/SearchStock'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <nav className="navbar">
          <div className="navbar-brand">
            <Link to="/">Stock Analyzer</Link>
          </div>
          <div className="navbar-links">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/searchstock">Search</Link>
            <Link to="/login" className="btn-glow">Login</Link>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path='/' element={<LandingPage />} />
            <Route path='/login' element={<Login />} />
            <Route path='/signup' element={<SignUp />} />
            <Route path='/about' element={<About />} />
            <Route element={<ProtectedRoute />}>
              <Route path='/dashboard' element={<Dashboard/>}/>
              <Route path='/searchstock' element={<SearchStock/>}/>
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