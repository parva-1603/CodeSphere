import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code2, ArrowRight, Sparkles } from 'lucide-react';

const Landing = () => {
  return (
    <div className="landing-container">
      <div className="bg-gradient-container">
        <div className="bg-gradient-1"></div>
        <div className="bg-gradient-2"></div>
      </div>

      <div style={{ position: 'relative', zIndex: 10 }}>
        <header className="landing-header">
          <div className="landing-logo-container">
            <div className="landing-logo-icon">
              <Code2 style={{ color: 'white' }} size={20} />
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>CodeSphere</span>
          </div>
          <div className="landing-nav">
            <Link to="/login" style={{ color: '#a1a1aa', fontWeight: 500, fontSize: '0.875rem' }}>Sign in</Link>
            <Link to="/login" className="btn-white">Get Started</Link>
          </div>
        </header>

        <main>
          <section className="hero-section">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="hero-badge"
            >
              <Sparkles size={16} color="#c084fc" />
              <span>The next evolution of pair programming</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="hero-title"
            >
              Ship code faster, <br /> together.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hero-subtitle"
            >
              A unified real-time workspace that merges multiplayer code editing, built-in video calls, an AI pair programmer, and native GitHub sync into a single room.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <Link to="/login" className="hero-cta">
                Start Coding Free
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Landing;
