import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

// Stagger children in cleanly
const container = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const item = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

function Hero() {
    // Fix: use AuthContext instead of raw localStorage so state is always current
    const { isAuthenticated } = useAuth();

    return (
        <motion.div
            className="hero-section"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <motion.h1 variants={item}>
                Track your investments<br />with clarity.
            </motion.h1>
            <motion.p className="hero-subtitle" variants={item}>
                Real-time quotes, historical charts, and a personal watchlist.
                Everything you need to stay informed, without the noise.
            </motion.p>
            <motion.div className="hero-buttons" variants={item}>
                {isAuthenticated ? (
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
            </motion.div>
        </motion.div>
    );
}

export default Hero;
