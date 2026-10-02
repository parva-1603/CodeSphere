import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, GitBranch, Video, Users, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

/* ── Noise + Grid background ─────────────────────────────── */
const MonoBg = () => (
  <div className="mono-bg">
    <div className="mono-bg-grid" />
    <div className="mono-bg-noise" />
    <div className="mono-bg-vignette" />
  </div>
);

/* ── Canvas — static noise / CRT scanlines ───────────────── */
const StaticCanvas = () => {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const tick = () => {
      const w = canvas.width, h = canvas.height;
      const img = ctx.createImageData(w, h);
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 10 | 0;
        data[i] = data[i+1] = data[i+2] = v;
        data[i+3] = 20;
      }
      ctx.putImageData(img, 0, 0);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return (
    <canvas
      ref={ref}
      style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        mixBlendMode: 'screen', opacity: 0.4
      }}
    />
  );
};

const TICKER = [
  { icon: <Zap size={11} />, label: 'Real-Time Collaboration' },
  { icon: <Video size={11} />, label: 'Integrated Video' },
  { icon: <GitBranch size={11} />, label: 'GitHub Sync' },
  { icon: <Terminal size={11} />, label: 'AI Code Assistant' },
  { icon: <Users size={11} />, label: 'Multi-Cursor Editing' },
];
const TICKER_ITEMS = [...TICKER, ...TICKER];

const fadeUp = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } };

const Landing = () => (
  <div className="landing-wrap">
    <MonoBg />
    <StaticCanvas />

    {/* Nav */}
    <header className="cs-header" style={{ zIndex: 100 }}>
      <div className="cs-logo">
        <div className="cs-logo-mark">
          <Terminal size={14} color="#0a0a0a" />
        </div>
        <span className="cs-logo-text">CodeSphere</span>
      </div>
      <nav className="cs-nav">
        <Link to="/login" className="cs-nav-link">Sign In</Link>
        <Link to="/login" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.78rem', borderRadius: 2 }}>
          Get Started
        </Link>
      </nav>
    </header>

    {/* Hero */}
    <main className="landing-content">
      <section className="hero">
        {/* Eyebrow */}
        <motion.div
          className="hero-eyebrow"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="hero-eyebrow-dot" />
          Now in open beta
        </motion.div>

        {/* Title */}
        <motion.h1
          className="hero-title"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="hero-title-line1">Code</span>
          <span className="hero-title-line2">Together</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="hero-subtitle"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          A collaborative coding environment for teams who ship fast.
          Real-time editing, video calls, GitHub sync, and AI — all in one place.
        </motion.p>

        {/* CTA */}
        <motion.div
          className="hero-actions"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link to="/login" className="btn-hero">
            Open a Room <ArrowRight size={14} />
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hero-secondary-link"
          >
            View on GitHub <ArrowRight size={11} />
          </a>
        </motion.div>

        {/* Divider */}
        <motion.div
          className="hero-divider"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.5, delay: 0.45 }}
        />

        {/* Stats row */}
        <motion.div
          style={{ display: 'flex', gap: '2.5rem', justifyContent: 'center', flexWrap: 'wrap' }}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {[
            ['< 50ms', 'Sync Latency'],
            ['∞', 'Collaborators'],
            ['100%', 'Open Source'],
          ].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: '#fff', lineHeight: 1 }}>{val}</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: '#606060', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </motion.div>

        {/* Scrolling ticker */}
        <div className="hero-ticker">
          <div className="hero-ticker-inner">
            {TICKER_ITEMS.map((t, i) => (
              <span key={i} className="hero-ticker-item">
                {t.icon}
                {t.label}
                <span className="hero-ticker-sep">/</span>
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  </div>
);

export default Landing;
