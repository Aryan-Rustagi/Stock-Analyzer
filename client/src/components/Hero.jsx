import React from 'react';
import {Link} from "react-router-dom";

function Hero(){
    return(
        <div style={{textAlign: "center", padding: "4rem 0"}}>
            <h1 className="hero-header">Market Insights, <br/> Redefined.</h1>
            <p className="hero-subtitle">
                Explore live stock market data, search your favorite companies, and manage your investments—all in one premium, lightning-fast platform.
            </p>

            <div style={{display: "flex", gap: "1rem", justifyContent: "center"}}>
                <Link to="/signup">
                    <button className="btn-glow" style={{padding: "1rem 2.5rem", fontSize: "1.1rem"}}>Get Started</button>
                </Link>
                <Link to="/login">
                    <button className="btn-glow btn-glass" style={{padding: "1rem 2.5rem", fontSize: "1.1rem"}}>Login</button>
                </Link>
            </div>
        </div>
    )
}
export default Hero