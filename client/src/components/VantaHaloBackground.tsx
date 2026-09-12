import React, { useEffect, useRef } from 'react';

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
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if ((existing as any).dataset.loaded === 'true') {
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
  baseColor = 0x38bdf8,
  size = 1.0,
  mouseControls = true,
  touchControls = true,
  gyroControls = false,
}) => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffectRef = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;

    const initVanta = async () => {
      if (typeof window === 'undefined') return;

      try {
        if (!window.THREE) {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js');
        }

        if (!window.VANTA || !window.VANTA.HALO) {
          await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.halo.min.js');
        }

        if (isCancelled || !vantaRef.current || !window.VANTA?.HALO) return;

        // Clean up any previous instance
        if (vantaEffectRef.current) {
          vantaEffectRef.current.destroy();
        }

        vantaEffectRef.current = window.VANTA.HALO({
          el: vantaRef.current,
          mouseControls,
          touchControls,
          gyroControls,
          minHeight: 200.0,
          minWidth: 200.0,
          backgroundColor,
          baseColor,
          size,
        });
      } catch (err) {
        console.warn('Could not initialize Vanta Halo background:', err);
      }
    };

    initVanta();

    return () => {
      isCancelled = true;
      if (vantaEffectRef.current) {
        try {
          vantaEffectRef.current.destroy();
        } catch {
          // ignore cleanup error
        }
        vantaEffectRef.current = null;
      }
    };
  }, [backgroundColor, baseColor, size, mouseControls, touchControls, gyroControls]);

  return (
    <div
      ref={vantaRef}
      className={`relative w-full min-h-screen overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
};

export default VantaHaloBackground;
