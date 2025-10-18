'use client';

import { useEffect, useRef, useState } from 'react';

interface SpaceBackgroundProps {
  className?: string;
  particles?: number;
  speed?: number;
  gradient?: string[];
  size?: { min: number; max: number };
  opacity?: { min: number; max: number };
  connectionDistance?: number;
  connectionOpacity?: number;
  mouseInteraction?: boolean;
  animateConnections?: boolean;
  backgroundGradient?: boolean;
  responsive?: boolean;
  retina?: boolean;
  preset?: 'subtle' | 'medium' | 'intense' | 'minimal';
  gradientTheme?: 'vonix' | 'ocean' | 'sunset' | 'fire' | 'cool' | 'warm' | 'purple' | 'green' | 'blue';
  style?: React.CSSProperties;
}

export default function SpaceBackground({
  className = '',
  particles = 150,
  speed = 0.5,
  gradient = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#ef4444'],
  size = { min: 1, max: 3 },
  opacity = { min: 0.1, max: 0.8 },
  connectionDistance = 100,
  connectionOpacity = 0.2,
  mouseInteraction = true,
  animateConnections = true,
  backgroundGradient = false,
  responsive = true,
  retina = true,
  preset,
  gradientTheme,
  style = {}
}: SpaceBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spaceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Dynamically import Space.js
    const initSpace = async () => {
      try {
        // Try to import from the Space.js file
        const SpaceModule = await import('../lib/space.js');
        const Space = SpaceModule.default;

        // Build configuration object
        let config: any = {
          particles,
          gradient: gradientTheme ? Space.gradients[gradientTheme] : gradient,
          speed,
          size,
          opacity,
          connectionDistance,
          connectionOpacity,
          mouseInteraction,
          animateConnections,
          backgroundGradient,
          responsive,
          retina
        };

        // Apply preset if specified
        if (preset && Space.presets[preset]) {
          config = { ...Space.presets[preset], ...config };
        }

        // Ensure canvas is not null before creating Space instance
        const canvas = canvasRef.current;
        if (canvas) {
          spaceRef.current = new Space(canvas, config);
          setIsLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load Space.js:', error);
        // Fallback: create a simple animated background
        createFallbackBackground();
        setIsLoaded(true);
      }
    };

    initSpace();

    return () => {
      if (spaceRef.current) {
        spaceRef.current.destroy();
      }
    };
  }, [particles, gradient, gradientTheme, speed, size, opacity, connectionDistance, connectionOpacity, mouseInteraction, animateConnections, backgroundGradient, responsive, retina, preset]);

  // Fallback background for when Space.js fails to load
  const createFallbackBackground = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    resize();
    window.addEventListener('resize', resize);

    // Simple animated gradient fallback
    let time = 0;
    const animate = () => {
      time += 0.01;
      
      const gradient = ctx.createLinearGradient(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(0.25, '#8b5cf6');
      gradient.addColorStop(0.5, '#ec4899');
      gradient.addColorStop(0.75, '#f97316');
      gradient.addColorStop(1, '#ef4444');

      ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.1;
      ctx.fillRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

      requestAnimationFrame(animate);
    };

    animate();
  };

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{
        zIndex: -1,
        ...style
      }}
    />
  );
}

// Re-export Space class for direct access
import Space from '../lib/space.js';
export { Space };

// Legacy exports - use Space.presets and Space.gradients instead
export const SpacePresets = {
  subtle: {
    particles: 50,
    speed: 0.2,
    opacity: { min: 0.05, max: 0.3 },
    connectionOpacity: 0.1,
    animateConnections: false
  },
  medium: {
    particles: 100,
    speed: 0.5,
    opacity: { min: 0.1, max: 0.6 },
    connectionOpacity: 0.15
  },
  intense: {
    particles: 200,
    speed: 1.0,
    opacity: { min: 0.2, max: 0.8 },
    connectionOpacity: 0.3,
    mouseInteraction: true
  },
  minimal: {
    particles: 30,
    speed: 0.1,
    opacity: { min: 0.05, max: 0.2 },
    animateConnections: false,
    mouseInteraction: false
  }
};

export const GradientPresets = {
  vonix: ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#ef4444'],
  ocean: ['#0ea5e9', '#06b6d4', '#10b981', '#84cc16'],
  sunset: ['#f97316', '#ec4899', '#8b5cf6', '#3b82f6'],
  fire: ['#ef4444', '#f97316', '#eab308', '#84cc16'],
  cool: ['#06b6d4', '#3b82f6', '#8b5cf6', '#a855f7'],
  warm: ['#f97316', '#ef4444', '#ec4899', '#f472b6'],
  purple: ['#8b5cf6', '#a855f7', '#c084fc', '#e879f9'],
  green: ['#10b981', '#34d399', '#6ee7b7', '#84cc16'],
  blue: ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
};
