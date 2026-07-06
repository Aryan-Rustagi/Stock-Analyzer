//Login
import React, { useState } from 'react';
import {UseState, UseEffect} from 'react';

function Login(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    function handleemailchange(event){
        setEmail(event.target.value);
    }


    function handlePasswordChange(event){
        setPassword(event.target.value);
    }

    function handleSubmit(event){
        event.preventDefault();
        console.log(email);
console.log(password);
        
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
            onChange={handleemailchange}
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

        </div>
    )
}

export default Login