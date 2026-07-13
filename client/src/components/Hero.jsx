import { Link } from "react-router-dom";

function Hero() {
    const isLoggedIn = !!localStorage.getItem('token');
    return (
        <div className="hero-section">
            <h1>Track your investments<br />with clarity.</h1>
            <p className="hero-subtitle">
                Real-time quotes, historical charts, and a personal watchlist. 
                Everything you need to stay informed, without the noise.
            </p>

            <div className="hero-buttons">
                {isLoggedIn ? (
                    <Link to="/dashboard">
                        <button className="btn-primary">Go to Dashboard</button>
                    </Link>
                ) : (
                    <>
                        <Link to="/signup">
                            <button className="btn-primary">Get Started</button>
                        </Link>
                        <Link to="/login">
                            <button className="btn-secondary">Sign In</button>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}

export default Hero;