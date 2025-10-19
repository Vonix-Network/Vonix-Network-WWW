'use client';

import { useEffect, useRef } from 'react';

interface MatrixRainProps {
  className?: string;
  speed?: number;
  opacity?: number;
  color?: string;
}

/**
 * Matrix-style digital rain background
 * Perfect for cyber/tech aesthetic with Minecraft theme
 */
export default function MatrixRain({
  className = '',
  speed = 1,
  opacity = 0.15,
  color = '#06FFA5' // Vonix green
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Minecraft-style characters + binary
    const chars = '█▓▒░01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    
    const fontSize = 16;
    let drops: number[] = [];

    const initDrops = () => {
      const columns = Math.floor(canvas.width / fontSize);
      drops = [];
      for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100;
      }
    };

    const resize = () => {
      // Match viewport size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Reinitialize drops for new column count
      initDrops();
    };

    resize();
    window.addEventListener('resize', resize);

    let animationFrame: number;

    const draw = () => {
      // Apply fade effect for trails (higher alpha = faster fade)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw characters
      ctx.font = `${fontSize}px monospace`;
      ctx.textBaseline = 'top';

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Only draw if on screen
        if (y >= 0 && y < canvas.height) {
          ctx.fillStyle = color;
          ctx.globalAlpha = opacity;
          ctx.fillText(char, x, y);
          ctx.globalAlpha = 1;
        }

        // Reset drop to top randomly when off screen
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = -Math.random() * 50; // Start above screen
        }

        drops[i] += speed * 0.5;
      }

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, [speed, opacity, color]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-screen h-screen pointer-events-none ${className}`}
      style={{ zIndex: -1 }}
    />
  );
}
