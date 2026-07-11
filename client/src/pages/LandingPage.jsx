import About from '../components/About';
import Hero from '../components/Hero';

function LandingPage() {
    return (
        <div className="animate-in">
            <Hero />
            <div style={{marginTop: "5rem"}}>
                <About />
            </div>
        </div>
    )
}

export default LandingPage