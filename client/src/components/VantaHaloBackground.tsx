import React, { useEffect, useRef, useState } from 'react';

export interface VantaHaloBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  backgroundColor?: number;
  baseColor?: number;
  size?: number;
  mouseControls?: boolean;
  touchControls?: boolean;
  gyroControls?: boolean;
}

const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === 'true' || (window as any).THREE) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
};

export const VantaHaloBackground: React.FC<VantaHaloBackgroundProps> = ({
  children,
  className = '',
  backgroundColor = 0x020617,
  baseColor = 0x6366f1,
  size = 1.2,
  mouseControls = true,
  touchControls = true,
  gyroControls = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vantaEffectRef = useRef<any>(null);
  const [vantaLoaded, setVantaLoaded] = useState(false);

  // Fallback / instant particle halo canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const onResize = () => {
      if (!canvas.parentElement) return;
      w = canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
      h = canvas.height = canvas.parentElement.clientHeight || window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const r = (baseColor >> 16) & 255;
    const g = (baseColor >> 8) & 255;
    const b = baseColor & 255;

    let mx = w / 2, my = h / 2, tmx = w / 2, tmy = h / 2;
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      tmx = e.clientX - rect.left;
      tmy = e.clientY - rect.top;
    };
    window.addEventListener('mousemove', onMove);

    const count = Math.min(45, Math.floor(w / 35));
    const pts = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      rad: Math.random() * 2 + 1,
      op: Math.random() * 0.5 + 0.2,
      ang: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    const draw = () => {
      t += 0.015;
      mx += (tmx - mx) * 0.05;
      my += (tmy - my) * 0.05;
      ctx.clearRect(0, 0, w, h);

      const rad = Math.min(w, h) * 0.45 * size;
      const grad = ctx.createRadialGradient(mx, my, rad * 0.1, mx, my, rad);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.25)`);
      grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, 0.12)`);
      grad.addColorStop(0.7, `rgba(139, 92, 246, 0.06)`);
      grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Rotating dashed ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(mx, my, rad * 0.55 + Math.sin(t * 2) * 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 12]);
      ctx.stroke();
      ctx.restore();

      // Particles
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx; p.y += p.vy; p.ang += 0.02;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.rad, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.op + Math.sin(p.ang) * 0.2})`;
        ctx.fill();

        for (let j = i + 1; j < pts.length; j++) {
          const p2 = pts[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.1 * (1 - dist / 90)})`;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(animId);
    };
  }, [baseColor, size]);

  // Vanta 3D WebGL Halo
  useEffect(() => {
    let cancelled = false;
    const initVanta = async () => {
      if (typeof window === 'undefined') return;
      try {
        if (!window.THREE) {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js');
        }
        if (!window.VANTA || !window.VANTA.HALO) {
          await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.halo.min.js');
        }
        if (cancelled || !containerRef.current || !window.VANTA?.HALO) return;

        if (vantaEffectRef.current) {
          try { vantaEffectRef.current.destroy(); } catch {}
        }

        vantaEffectRef.current = window.VANTA.HALO({
          el: containerRef.current,
          mouseControls,
          touchControls,
          gyroControls,
          minHeight: 200.0,
          minWidth: 200.0,
          backgroundColor,
          baseColor,
          size,
        });
        setVantaLoaded(true);
      } catch (err) {
        console.info('Using dynamic ambient particle canvas background:', err);
      }
    };
    initVanta();
    return () => {
      cancelled = true;
      if (vantaEffectRef.current) {
        try { vantaEffectRef.current.destroy(); } catch {}
        vantaEffectRef.current = null;
      }
    };
  }, [backgroundColor, baseColor, size, mouseControls, touchControls, gyroControls]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-h-screen overflow-x-hidden ${className}`}
      style={{ backgroundColor: `#${backgroundColor.toString(16).padStart(6, '0')}` }}
    >
      <canvas
        ref={canvasRef}
        className={`pointer-events-none absolute inset-0 z-0 h-full w-full transition-opacity duration-1000 ${
          vantaLoaded ? 'opacity-35' : 'opacity-100'
        }`}
      />
      <div className="relative z-10 w-full min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default VantaHaloBackground;
