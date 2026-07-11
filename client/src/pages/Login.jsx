import { useState } from "react";
import { Link } from "react-router-dom";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
function Login(){
    const navigate=useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage]=useState("");
    function handleEmailChange(event){
        setEmail(event.target.value);
    }
    function handlePasswordChange(event){
        setPassword(event.target.value);
    }   


   async function handleSubmit(event) {
    event.preventDefault();

    if (email === '') {
        setError('Please enter the email');
        setMessage('');
    } else if (password === '') {
        setError('Please enter the password');
        setMessage('');
    } else {
        setError('');
        setMessage('');

        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email: email,
                password: password
            });

            localStorage.setItem('token', response.data.token);
            alert('Login successful!');
            navigate('/dashboard');
        }
        catch(err) {
            setError(err.response?.data?.message || 'Login failed');
            setMessage('');
        }
    }
}
    
    
    return(
        <div>

        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input 
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={handleEmailChange}
            />

        <br />
        <br />
            <label>Password</label>
            <input 
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={handlePasswordChange}
            />

            <br/>
             <br/>

        <button>Login</button>

        </form>
        {/* Conditional Rendering */}

        {error && <p>{error}</p>}  
        {message && <p>{message}</p>}

        <Link to="/signup">
        <h6>Don't have an account? Sign-Up</h6>
        </Link>

        </div>
    )
}

export default Login