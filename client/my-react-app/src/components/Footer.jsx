//Footer
import {Link} from "react-router-dom";
function Footer(){
    return(
        <div>
         <h4>Stock Analyzer</h4>
         <h6>Empowering smarter investment decisions
            <br/>
with real-time market insights.
</h6>

<Link to="/About">About</Link>
<Link to="/Login">Login</Link>
<Link to="/SignUp">SignUp</Link>
<a
  href="https://github.com/Aryan-Rustagi"
  target="_blank"
  rel="noopener noreferrer"
>
  GitHub
</a>
        </div>
    )
}
export default Footer