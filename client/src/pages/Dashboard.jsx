//Dashboard
import {useNavigate} from "react-router-dom";
import {Link} from "react-router-dom";

function Dashboard(){

    const navigate = useNavigate();

    function handleLogout(){
        localStorage.removeItem('token');
        alert("Logged out successfully");
        navigate('/');
    }

    return(
        <div>
            <h1>Dashboard</h1>
            <p>Welcome to the dashboard</p>
            <Link to="/searchstock">Search Stock</Link>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
}

export default Dashboard;