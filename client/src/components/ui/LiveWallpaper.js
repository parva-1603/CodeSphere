import React, { useEffect, useRef } from 'react';
import './LiveWallpaper.css';

// A minimal simplex noise contour wallpaper implemented in a 2D Canvas for broad compatibility.
const LiveWallpaper = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId;
    let t = 0;

    const resize = () => {
      // Render at reduced resolution for performance (blur handles the rest)
      const pr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = window.innerWidth * pr * 0.5;
      canvas.height = window.innerHeight * pr * 0.5;
      ctx.scale(pr * 0.5, pr * 0.5);
    };

    window.addEventListener('resize', resize);
    resize();

    // Fast, cheap pseudo-random noise for the contour effect
    const noise = (x, y) => {
      return Math.sin(x * 0.01) * Math.cos(y * 0.01) * Math.sin((x + y) * 0.005);
    };

    const render = () => {
      // Respect prefers-reduced-motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        // Just draw a solid background if reduced motion
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-app').trim();
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        return;
      }

      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-app').trim();
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;

      // Draw subtle drifting contour lines
      ctx.beginPath();
      for (let y = 0; y < window.innerHeight; y += 40) {
        for (let x = 0; x < window.innerWidth; x += 40) {
          const n = noise(x + t, y + t);
          if (n > 0.2 && n < 0.25) {
            ctx.moveTo(x, y);
            ctx.lineTo(x + 40, y + 40 * n);
          }
        }
      }
      ctx.stroke();

      t += 0.5; // Slow drift

      // Cap at 30 FPS conceptually using requestAnimationFrame but throttling could be done
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Pause on visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        render();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="live-wallpaper" 
      aria-hidden="true" 
    />
  );
};

export default LiveWallpaper;
