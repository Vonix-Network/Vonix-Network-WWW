export interface SpacePresets {
  /** Subtle animation with minimal particles */
  subtle: SpaceOptions;
  
  /** Medium intensity animation */
  medium: SpaceOptions;
  
  /** Intense animation with many particles */
  intense: SpaceOptions;
  
  /** Minimal animation for performance */
  minimal: SpaceOptions;
}

export interface SpaceGradients {
  /** Default Vonix Network gradient */
  vonix: string[];
  
  /** Ocean-themed gradient */
  ocean: string[];
  
  /** Sunset-themed gradient */
  sunset: string[];
  
  /** Fire-themed gradient */
  fire: string[];
  
  /** Cool-themed gradient */
  cool: string[];
  
  /** Warm-themed gradient */
  warm: string[];
  
  /** Purple-themed gradient */
  purple: string[];
  
  /** Green-themed gradient */
  green: string[];
  
  /** Blue-themed gradient */
  blue: string[];
}

declare class Space {
  /** Canvas element */
  readonly canvas: HTMLCanvasElement;
  
  /** 2D rendering context */
  readonly ctx: CanvasRenderingContext2D;
  
  /** Current configuration options */
  readonly options: SpaceOptions;
  
  /** Array of particles */
  readonly particles: Particle[];
  
  /** Mouse position */
  readonly mouse: { x: number; y: number };
  
  /** Animation frame ID */
  readonly animationId: number | null;
  
  /** Animation time */
  readonly time: number;
  
  /** Static presets for common configurations */
  static readonly presets: SpacePresets;
  
  /** Static gradient presets */
  static readonly gradients: SpaceGradients;
  
  /** Library version */
  static readonly version: string;

  /**
   * Create a new Space instance
   */
  constructor(canvas: HTMLCanvasElement, options?: SpaceOptions);

  init(): void;
  resize(): void;
  createParticles(): void;
  createGradient(): void;
  getRandomGradientColor(): string;
  bindEvents(): void;
  updateParticles(): void;
  drawParticles(): void;
  drawConnections(): void;
  drawBackground(): void;
  animate(): void;
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
  
  // Public API methods
  updateOptions(newOptions: Partial<SpaceOptions>): void;
  setGradient(colors: string[]): void;
  addParticles(count: number): void;
  removeParticles(count: number): void;
  getParticleCount(): number;
  getOptions(): SpaceOptions;
  isAnimating(): boolean;
}

interface SpaceOptions {
  /** Number of particles to generate (default: 150) */
  particles?: number;
  
  /** Array of gradient colors (default: Vonix gradient) */
  gradient?: string[];
  
  /** Particle movement speed (default: 0.5) */
  speed?: number;
  
  /** Particle size range */
  size?: { min: number; max: number };
  
  /** Particle opacity range */
  opacity?: { min: number; max: number };
  
  /** Maximum distance for particle connections (default: 100) */
  connectionDistance?: number;
  
  /** Opacity of connection lines (default: 0.2) */
  connectionOpacity?: number;
  
  /** Enable mouse interaction (default: true) */
  mouseInteraction?: boolean;
  
  /** Enable connection animations (default: true) */
  animateConnections?: boolean;
  
  /** Enable background gradient (default: false) */
  backgroundGradient?: boolean;
  
  /** Enable responsive resizing (default: true) */
  responsive?: boolean;
  
  /** Enable retina display support (default: true) */
  retina?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  pulseSpeed: number;
  pulsePhase: number;
  currentOpacity?: number;
}

export default Space;
