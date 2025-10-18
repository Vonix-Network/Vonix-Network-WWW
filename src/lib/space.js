/**
 * Space.js - Enhanced animated space background library
 * Version: 2.0.0 - Vonix Network Edition
 * 
 * A customizable particle animation library with gradient support,
 * mouse interactions, and connection animations.
 * 
 * Usage:
 * const space = new Space(canvas, {
 *   particles: 100,
 *   gradient: ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#ef4444'],
 *   speed: 0.5,
 *   mouseInteraction: true
 * });
 */

class Space {
  constructor(canvas, options = {}) {
    // Validate canvas element
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Space.js: First argument must be a valid canvas element');
    }

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    if (!this.ctx) {
      throw new Error('Space.js: Unable to get 2D context from canvas');
    }

    // Enhanced configuration with new options
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
      backgroundGradient: options.backgroundGradient || false,
      responsive: options.responsive !== false,
      retina: options.retina !== false,
      ...options
    };

    // Enhanced internal state
    this.particles = [];
    this.mouse = { x: 0, y: 0 };
    this.animationId = null;
    this.time = 0;
    this.isRunning = false;

    // Initialize the animation
    this.init();
    this.bindEvents();
    this.start();
  }

  init() {
    this.resize();
    this.createParticles();
    this.createGradient();
  }

  /**
   * Handle canvas resizing with retina display support
   */
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = this.options.retina ? (window.devicePixelRatio || 1) : 1;
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  /**
   * Create particle array with random properties
   */
  createParticles() {
    this.particles = [];
    const dpr = this.options.retina ? (window.devicePixelRatio || 1) : 1;
    const canvasWidth = this.canvas.width / dpr;
    const canvasHeight = this.canvas.height / dpr;

    for (let i = 0; i < this.options.particles; i++) {
      this.particles.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
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

  /**
   * Create gradient for background (if enabled)
   */
  createGradient() {
    const dpr = this.options.retina ? (window.devicePixelRatio || 1) : 1;
    const gradient = this.ctx.createLinearGradient(
      0, 0, 
      this.canvas.width / dpr, 
      this.canvas.height / dpr
    );
    
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

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Resize handler
    const resizeHandler = () => {
      if (this.options.responsive) {
        this.resize();
        this.createParticles();
        this.createGradient();
      }
    };

    window.addEventListener('resize', resizeHandler);

    // Mouse interaction
    if (this.options.mouseInteraction) {
      const mouseMoveHandler = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
      };

      const mouseLeaveHandler = () => {
        this.mouse.x = 0;
        this.mouse.y = 0;
      };

      this.canvas.addEventListener('mousemove', mouseMoveHandler);
      this.canvas.addEventListener('mouseleave', mouseLeaveHandler);

      // Store handlers for cleanup
      this._resizeHandler = resizeHandler;
      this._mouseMoveHandler = mouseMoveHandler;
      this._mouseLeaveHandler = mouseLeaveHandler;
    }
  }

  /**
   * Update particle positions and properties
   */
  updateParticles() {
    const dpr = this.options.retina ? (window.devicePixelRatio || 1) : 1;
    const canvasWidth = this.canvas.width / dpr;
    const canvasHeight = this.canvas.height / dpr;

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

  /**
   * Draw background gradient (if enabled)
   */
  drawBackground() {
    const dpr = this.options.retina ? (window.devicePixelRatio || 1) : 1;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
    
    // Optional background gradient
    if (this.options.backgroundGradient && this.gradient) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.1;
      this.ctx.fillStyle = this.gradient;
      this.ctx.fillRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
      this.ctx.restore();
    }
  }

  /**
   * Main animation loop
   */
  animate() {
    if (!this.isRunning) return;
    
    this.time += 0.016; // ~60fps
    
    this.drawBackground();
    this.updateParticles();
    this.drawParticles();
    this.drawConnections();

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  /**
   * Start the animation
   */
  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }

  /**
   * Stop the animation
   */
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Pause the animation
   */
  pause() {
    this.isRunning = false;
  }

  /**
   * Resume the animation
   */
  resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }

  /**
   * Destroy the instance and clean up
   */
  destroy() {
    this.stop();
    
    // Remove event listeners
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
    }
    if (this._mouseMoveHandler) {
      this.canvas.removeEventListener('mousemove', this._mouseMoveHandler);
    }
    if (this._mouseLeaveHandler) {
      this.canvas.removeEventListener('mouseleave', this._mouseLeaveHandler);
    }

    // Clear canvas
    const dpr = this.options.retina ? (window.devicePixelRatio || 1) : 1;
    this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
    
    // Reset properties
    this.particles = [];
    this.mouse = { x: 0, y: 0 };
    this.time = 0;
  }

  // Public API methods for customization

  /**
   * Update configuration options
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    
    if (newOptions.gradient) {
      this.createGradient();
      this.particles.forEach(particle => {
        particle.color = this.getRandomGradientColor();
      });
    }
    
    if (newOptions.particles) {
      this.createParticles();
    }
  }

  /**
   * Set new gradient colors
   */
  setGradient(colors) {
    if (!Array.isArray(colors) || colors.length === 0) {
      throw new Error('Space.js: Gradient must be a non-empty array of color strings');
    }
    
    this.options.gradient = colors;
    this.createGradient();
    this.particles.forEach(particle => {
      particle.color = this.getRandomGradientColor();
    });
  }

  /**
   * Add particles to the animation
   */
  addParticles(count) {
    if (typeof count !== 'number' || count <= 0) {
      throw new Error('Space.js: Count must be a positive number');
    }

    const dpr = this.options.retina ? (window.devicePixelRatio || 1) : 1;
    const canvasWidth = this.canvas.width / dpr;
    const canvasHeight = this.canvas.height / dpr;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
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

  /**
   * Remove particles from the animation
   */
  removeParticles(count) {
    if (typeof count !== 'number' || count <= 0) {
      throw new Error('Space.js: Count must be a positive number');
    }
    
    this.particles.splice(-count, count);
  }

  /**
   * Get current particle count
   */
  getParticleCount() {
    return this.particles.length;
  }

  /**
   * Get current options
   */
  getOptions() {
    return { ...this.options };
  }

  /**
   * Check if animation is running
   */
  isAnimating() {
    return this.isRunning;
  }
}

// Static methods and presets
Space.presets = {
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

Space.gradients = {
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

// Version info
Space.version = '2.0.0';

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Space;
} else if (typeof window !== 'undefined') {
  window.Space = Space;
}

export default Space;
