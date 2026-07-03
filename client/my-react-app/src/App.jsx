import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import {BrowserRouter, Routes, Route} from "react-router-dom"

function App() {
  return (
     <BrowserRouter>
     <Routes>
      <Route path='/' element={<LandingPage/>}/>
      <Route path='/Login' element={<Login/>}/>
     </Routes>

     </BrowserRouter>

  )
}

export default App
