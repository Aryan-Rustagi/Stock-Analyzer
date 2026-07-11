import {useNavigate, Link} from "react-router-dom";

function Dashboard(){
    const navigate = useNavigate();

    function handleLogout(){
        localStorage.removeItem('token');
        alert("Logged out successfully");
        navigate('/');
    }

    return(
        <div style={{textAlign: "center", marginTop: "2rem"}}>
            <div className="glass-panel animate-in" style={{padding: "3rem", margin: "0 auto", maxWidth: "600px"}}>
                <h1>Dashboard</h1>
                <p style={{color: "var(--text-secondary)", marginBottom: "2rem"}}>Welcome back to your Stock Analyzer dashboard.</p>
                <div style={{display: "flex", gap: "1rem", justifyContent: "center"}}>
                    <Link to="/searchstock" className="btn-glow">Search Stocks</Link>
                    <button className="btn-glow btn-glass" onClick={handleLogout} style={{color: "var(--accent-red)", borderColor: "var(--accent-red)"}}>Logout</button>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;