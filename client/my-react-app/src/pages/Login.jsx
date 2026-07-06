//Login
import { useState } from "react";
function Login(){
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

    function handleSubmit(event){
        event.preventDefault();
        if(email===""){
            setError("Please enter the email");
        }
        else if(password===""){
            setError("Please enter the password");
        }
       else{
        setError("");

        console.log(email,password);
       }

       if(email!=="" && password!=="")
       {
        setMessage("Login Successful");
       }
       else{
        setMessage("");
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
        <p>{error}</p>
        <p>{message}</p>

        </div>
    )
}

export default Login