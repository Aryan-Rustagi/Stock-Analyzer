import { Link } from "react-router-dom";

function Hero() {
    const isLoggedIn = !!localStorage.getItem('token');
    return (
        <div className="hero-section">

            <div className="hero-particles">
                <div className="hero-particle"></div>
                <div className="hero-particle"></div>
                <div className="hero-particle"></div>
                <div className="hero-particle"></div>
                <div className="hero-particle"></div>
                <div className="hero-particle"></div>
            </div>


            <div className="hero-badge">✦ Real-time Market Data</div>

            <h1 className="hero-header">Market Insights, <br />Redefined.</h1>
            <p className="hero-subtitle">
                Explore live stock market data, search your favorite companies, and manage your investments—all in one premium, lightning-fast platform.
            </p>

            <div className="hero-buttons">
                {isLoggedIn ? (
                    <Link to="/dashboard">
                        <button className="btn-glow">Go to Dashboard</button>
                    </Link>
                ) : (
                    <>
                        <Link to="/signup">
                            <button className="btn-glow">Get Started</button>
                        </Link>
                        <Link to="/login">
                            <button className="btn-glow btn-glass">Login</button>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}

export default Hero;