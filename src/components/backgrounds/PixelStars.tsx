'use client';

import { useEffect, useRef } from 'react';

interface PixelStarsProps {
  className?: string;
  starCount?: number;
  speed?: number;
  colors?: string[];
}

/**
 * Pixelated starfield background
 * Minecraft-inspired with retro aesthetic
 */
export default function PixelStars({
  className = '',
  starCount = 200,
  speed = 1,
  colors = ['#06FFA5', '#00D9FF', '#C77DFF', '#FFD700']
}: PixelStarsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      // Match viewport size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    // No ResizeObserver needed when following viewport

    interface Star {
      x: number;
      y: number;
      size: number;
      speed: number;
      color: string;
      twinkle: number;
      twinkleSpeed: number;
    }

    const stars: Star[] = [];

    // Initialize stars
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.floor(Math.random() * 3) + 1, // 1-3px for pixelated look
        speed: (Math.random() * 0.5 + 0.2) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        twinkle: Math.random(),
        twinkleSpeed: Math.random() * 0.02 + 0.01
      });
    }

    let animationFrame: number;

    const draw = () => {
      // Clear canvas completely for crisp stars
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Disable image smoothing for pixelated effect
      ctx.imageSmoothingEnabled = false;

      stars.forEach((star) => {
        // Twinkling effect
        star.twinkle += star.twinkleSpeed;
        const opacity = (Math.sin(star.twinkle) + 1) / 2 * 0.6 + 0.2;

        ctx.fillStyle = star.color;
        ctx.globalAlpha = opacity;
        
        // Draw pixelated star (small rectangle)
        ctx.fillRect(
          Math.floor(star.x),
          Math.floor(star.y),
          star.size,
          star.size
        );

        // Move star
        star.y += star.speed;
        star.x += Math.sin(star.y * 0.01) * 0.5;

        // Wrap around
        if (star.y > canvas.height) {
          star.y = -10;
          star.x = Math.random() * canvas.width;
        }
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
      });

      ctx.globalAlpha = 1;
      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, [starCount, speed, colors]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-screen h-screen pointer-events-none ${className}`}
      style={{ zIndex: -1, imageRendering: 'pixelated' }}
    />
  );
}
