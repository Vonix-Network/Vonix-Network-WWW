'use client';

import { useEffect, useRef } from 'react';

interface NeuralNetProps {
  className?: string;
  nodes?: number;
  connectionDistance?: number;
  speed?: number;
  primaryColor?: string;
  secondaryColor?: string;
}

/**
 * Animated neural network / circuit board background
 * Tech-inspired with interconnected nodes
 */
export default function NeuralNet({
  className = '',
  nodes = 80,
  connectionDistance = 150,
  speed = 0.3,
  primaryColor = '#06FFA5',
  secondaryColor = '#00D9FF'
}: NeuralNetProps) {
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

    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      connections: number;
    }

    const nodeArray: Node[] = [];

    // Initialize nodes
    for (let i = 0; i < nodes; i++) {
      nodeArray.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        radius: Math.random() * 2 + 1,
        connections: 0
      });
    }

    let animationFrame: number;
    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const draw = () => {
      // Clear canvas completely for crisp rendering
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      nodeArray.forEach((node) => {
        node.connections = 0;

        // Move node
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Mouse interaction
        const dx = mouseX - node.x;
        const dy = mouseY - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 200) {
          node.x -= dx * 0.01;
          node.y -= dy * 0.01;
        }
      });

      // Draw connections
      for (let i = 0; i < nodeArray.length; i++) {
        for (let j = i + 1; j < nodeArray.length; j++) {
          const dx = nodeArray[i].x - nodeArray[j].x;
          const dy = nodeArray[i].y - nodeArray[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.3;
            
            // Create gradient line
            const gradient = ctx.createLinearGradient(
              nodeArray[i].x,
              nodeArray[i].y,
              nodeArray[j].x,
              nodeArray[j].y
            );
            gradient.addColorStop(0, primaryColor);
            gradient.addColorStop(1, secondaryColor);

            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.globalAlpha = opacity;
            ctx.lineWidth = 0.5;
            ctx.moveTo(nodeArray[i].x, nodeArray[i].y);
            ctx.lineTo(nodeArray[j].x, nodeArray[j].y);
            ctx.stroke();

            nodeArray[i].connections++;
            nodeArray[j].connections++;
          }
        }
      }

      // Draw nodes
      nodeArray.forEach((node) => {
        const gradient = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          node.radius * 3
        );
        
        const alpha = Math.min(node.connections * 0.1, 1);
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.globalAlpha = alpha * 0.8;
        ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core node
        ctx.beginPath();
        ctx.fillStyle = primaryColor;
        ctx.globalAlpha = 1;
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrame);
    };
  }, [nodes, connectionDistance, speed, primaryColor, secondaryColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-screen h-screen pointer-events-none ${className}`}
      style={{ zIndex: -1 }}
    />
  );
}
