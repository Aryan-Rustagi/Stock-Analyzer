import { useNavigate, Link } from "react-router-dom";

function Dashboard() {
    var navigate = useNavigate();

    function handleLogout() {
        localStorage.removeItem('token');
        alert("Logged out successfully");
        navigate('/');
    }


    return (
        <div className="animate-in">

            <div className="dashboard-greeting">
                <p>Welcome back to your Stock Analyzer dashboard.</p>
            </div>


            <div className="dashboard-cards">
                <Link to="/searchstock" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="glass-panel dashboard-card">
                        <div className="dashboard-card-icon">🔍</div>
                        <h3>Search Stocks</h3>
                        <p>Look up any stock by symbol or company name. Get real-time prices, market data, and historical charts.</p>
                    </div>
                </Link>

                <Link to="/portfolio" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="glass-panel dashboard-card">
                        <div className="dashboard-card-icon">📊</div>
                        <h3>My Portfolio</h3>
                        <p>Track your favorite stocks in one place. Add, remove, and monitor live prices for your investments.</p>
                    </div>
                </Link>

                <div className="glass-panel dashboard-card" onClick={handleLogout} style={{ cursor: 'pointer' }}>
                    <div className="dashboard-card-icon">🚪</div>
                    <h3>Logout</h3>
                    <p>Sign out of your account securely. Your portfolio will be saved for when you return.</p>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;