//Hero
import React from 'react';
import {Link} from "react-router-dom";
function Hero(){
    return(
    <div>
        <h1>Stock Analyzer</h1>
        <p>Explore live stock market data, search your
favorite companies, and manage your investments—
all in one place.</p>

<Link to="/SignUp">
<button>SignUp</button></Link>

<Link to="/Login">
<button>Login</button></Link>
    </div>
    )
}
export default Hero