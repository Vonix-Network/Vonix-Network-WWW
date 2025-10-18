/**
 * Space.js - Custom animated space background library
 * Designed for Vonix Network with gradient support
 * 
 * Usage:
 * const space = new Space(canvas, {
 *   particles: 100,
 *   gradient: ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#ef4444'],
 *   speed: 0.5
 * });
 */

class Space {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = {
      particles: options.particles || 150,
      gradient: options.gradient || ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#ef4444'],
      speed: options.speed || 0.5,
      size: options.size || { min: 1, max: 3 },
      opacity: options.opacity || { min: 0.1, max: 0.8 },
      connectionDistance: options.connectionDistance || 100,
      connectionOpacity: options.connectionOpacity || 0.2,
      mouseInteraction: options.mouseInteraction !== false,
      animateConnections: options.animateConnections !== false,
      ...options
    };

    this.particles = [];
    this.mouse = { x: 0, y: 0 };
    this.animationId = null;
    this.time = 0;

    this.init();
    this.bindEvents();
    this.start();
  }

  init() {
    this.resize();
    this.createParticles();
    this.createGradient();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.options.particles; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width / window.devicePixelRatio,
        y: Math.random() * this.canvas.height / window.devicePixelRatio,
        vx: (Math.random() - 0.5) * this.options.speed,
        vy: (Math.random() - 0.5) * this.options.speed,
        size: Math.random() * (this.options.size.max - this.options.size.min) + this.options.size.min,
        opacity: Math.random() * (this.options.opacity.max - this.options.opacity.min) + this.options.opacity.min,
        color: this.getRandomGradientColor(),
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
  }

  createGradient() {
    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width / window.devicePixelRatio, this.canvas.height / window.devicePixelRatio);
    const step = 1 / (this.options.gradient.length - 1);
    
    this.options.gradient.forEach((color, index) => {
      gradient.addColorStop(index * step, color);
    });
    
    this.gradient = gradient;
  }

  getRandomGradientColor() {
    const index = Math.floor(Math.random() * this.options.gradient.length);
    return this.options.gradient[index];
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.createParticles();
      this.createGradient();
    });

    if (this.options.mouseInteraction) {
      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.mouse.x = 0;
        this.mouse.y = 0;
      });
    }
  }

  updateParticles() {
    const canvasWidth = this.canvas.width / window.devicePixelRatio;
    const canvasHeight = this.canvas.height / window.devicePixelRatio;

    this.particles.forEach(particle => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Update pulse
      particle.pulsePhase += particle.pulseSpeed;
      particle.currentOpacity = particle.opacity * (0.5 + 0.5 * Math.sin(particle.pulsePhase));

      // Mouse interaction
      if (this.options.mouseInteraction && (this.mouse.x !== 0 || this.mouse.y !== 0)) {
        const dx = this.mouse.x - particle.x;
        const dy = this.mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          const force = (100 - distance) / 100;
          particle.vx -= (dx / distance) * force * 0.01;
          particle.vy -= (dy / distance) * force * 0.01;
        }
      }

      // Wrap around edges
      if (particle.x < 0) particle.x = canvasWidth;
      if (particle.x > canvasWidth) particle.x = 0;
      if (particle.y < 0) particle.y = canvasHeight;
      if (particle.y > canvasHeight) particle.y = 0;

      // Apply friction
      particle.vx *= 0.99;
      particle.vy *= 0.99;
    });
  }

  drawParticles() {
    this.particles.forEach(particle => {
      this.ctx.save();
      this.ctx.globalAlpha = particle.currentOpacity || particle.opacity;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Add glow effect
      this.ctx.shadowBlur = particle.size * 3;
      this.ctx.shadowColor = particle.color;
      this.ctx.fill();
      this.ctx.restore();
    });
  }

  drawConnections() {
    if (!this.options.animateConnections) return;

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.options.connectionDistance) {
          const opacity = (1 - distance / this.options.connectionDistance) * this.options.connectionOpacity;
          
          // Create gradient for connection line
          const gradient = this.ctx.createLinearGradient(
            this.particles[i].x, this.particles[i].y,
            this.particles[j].x, this.particles[j].y
          );
          gradient.addColorStop(0, this.particles[i].color);
          gradient.addColorStop(1, this.particles[j].color);

          this.ctx.save();
          this.ctx.globalAlpha = opacity;
          this.ctx.strokeStyle = gradient;
          this.ctx.lineWidth = 0.5;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
          this.ctx.restore();
        }
      }
    }
  }

  drawBackground() {
    // Clear canvas with transparent background
    this.ctx.clearRect(0, 0, this.canvas.width / window.devicePixelRatio, this.canvas.height / window.devicePixelRatio);
    
    // Optional: Add subtle background gradient
    if (this.options.backgroundGradient) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.1;
      this.ctx.fillStyle = this.gradient;
      this.ctx.fillRect(0, 0, this.canvas.width / window.devicePixelRatio, this.canvas.height / window.devicePixelRatio);
      this.ctx.restore();
    }
  }

  animate() {
    this.time += 0.016; // ~60fps
    
    this.drawBackground();
    this.updateParticles();
    this.drawParticles();
    this.drawConnections();

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  start() {
    this.animate();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  // Public methods for customization
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    if (newOptions.gradient) {
      this.createGradient();
    }
    if (newOptions.particles) {
      this.createParticles();
    }
  }

  setGradient(colors) {
    this.options.gradient = colors;
    this.createGradient();
    this.particles.forEach(particle => {
      particle.color = this.getRandomGradientColor();
    });
  }

  addParticles(count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width / window.devicePixelRatio,
        y: Math.random() * this.canvas.height / window.devicePixelRatio,
        vx: (Math.random() - 0.5) * this.options.speed,
        vy: (Math.random() - 0.5) * this.options.speed,
        size: Math.random() * (this.options.size.max - this.options.size.min) + this.options.size.min,
        opacity: Math.random() * (this.options.opacity.max - this.options.opacity.min) + this.options.opacity.min,
        color: this.getRandomGradientColor(),
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
  }

  removeParticles(count) {
    this.particles.splice(-count, count);
  }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Space;
} else if (typeof window !== 'undefined') {
  window.Space = Space;
}

export default Space;
