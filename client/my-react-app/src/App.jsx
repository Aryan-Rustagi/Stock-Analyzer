import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import {BrowserRouter, Routes, Route} from "react-router-dom"

function App() {
  return (
     <BrowserRouter>
     <Routes>
      <Route path='/' element={<LandingPage/>}/>
      <Route path='/Login' element={<Login/>}/>
      <Route path='/SignUp' element={<SignUp/>}/>
     </Routes>

     </BrowserRouter>

  )
}

export default App
