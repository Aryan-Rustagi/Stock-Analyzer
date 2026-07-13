import { Link, useNavigate } from "react-router-dom";

function Dashboard() {
    var navigate = useNavigate();

    function handleLogout() {
        localStorage.removeItem('token');
        navigate('/');
        window.location.reload();
    }

    return (
        <div className="fade-in">
            <div className="dashboard-greeting">
                <h1>Dashboard</h1>
                <p>What would you like to do today?</p>
            </div>

            <div className="dashboard-cards">
                <Link to="/searchstock" className="dashboard-card">
                    <div className="dashboard-card-icon">↗</div>
                    <div>
                        <h3>Search Stocks</h3>
                        <p>Look up any stock by symbol. Get real-time prices, market data, and historical charts.</p>
                    </div>
                </Link>

                <Link to="/portfolio" className="dashboard-card">
                    <div className="dashboard-card-icon">◉</div>
                    <div>
                        <h3>My Portfolio</h3>
                        <p>Track your saved stocks in one place. Monitor live prices across your holdings.</p>
                    </div>
                </Link>

                <div className="dashboard-card" onClick={handleLogout}>
                    <div className="dashboard-card-icon">→</div>
                    <div>
                        <h3>Sign Out</h3>
                        <p>Log out of your account. Your portfolio will be saved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;