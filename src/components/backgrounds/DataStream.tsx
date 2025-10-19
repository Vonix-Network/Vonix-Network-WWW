'use client';

import { useEffect, useRef } from 'react';

interface DataStreamProps {
  className?: string;
  streamCount?: number;
  speed?: number;
  color?: string;
}

/**
 * Binary data stream background
 * Perfect for tech/cyber aesthetic
 */
export default function DataStream({
  className = '',
  streamCount = 15,
  speed = 1,
  color = '#06FFA5'
}: DataStreamProps) {
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

    interface Stream {
      x: number;
      data: string[];
      speed: number;
      offset: number;
    }

    const streams: Stream[] = [];
    const chars = '01';
    const streamHeight = 30;

    // Initialize streams
    for (let i = 0; i < streamCount; i++) {
      const streamData = [];
      for (let j = 0; j < streamHeight; j++) {
        streamData.push(Math.random() > 0.5 ? '1' : '0');
      }

      streams.push({
        x: (canvas.width / streamCount) * i + Math.random() * 50,
        data: streamData,
        speed: (Math.random() * 0.5 + 0.5) * speed,
        offset: Math.random() * 100
      });
    }

    let animationFrame: number;
    let time = 0;

    const draw = () => {
      time += 0.01;
      
      // Fade effect for data stream trails
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = '14px monospace';

      streams.forEach((stream) => {
        stream.offset += stream.speed;

        // Draw binary stream
        stream.data.forEach((char, index) => {
          const y = (index * 20 + stream.offset) % canvas.height;
          
          // Flickering effect
          if (Math.random() > 0.95) {
            stream.data[index] = Math.random() > 0.5 ? '1' : '0';
          }

          // Gradient opacity based on position
          const opacity = Math.sin((y / canvas.height) * Math.PI) * 0.6 + 0.2;
          
          ctx.fillStyle = color;
          ctx.globalAlpha = opacity;
          ctx.fillText(char, stream.x, y);
        });

        // Reset offset
        if (stream.offset > canvas.height) {
          stream.offset = -100;
        }
      });

      ctx.globalAlpha = 1;
      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, [streamCount, speed, color]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-screen h-screen pointer-events-none ${className}`}
      style={{ zIndex: -1 }}
    />
  );
}
