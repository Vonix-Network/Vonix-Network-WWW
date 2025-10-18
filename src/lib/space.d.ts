declare class Space {
  constructor(canvas: HTMLCanvasElement, options?: SpaceOptions);
  
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  options: SpaceOptions;
  particles: Particle[];
  mouse: { x: number; y: number };
  animationId: number | null;
  time: number;

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
  
  // Public methods
  updateOptions(newOptions: Partial<SpaceOptions>): void;
  setGradient(colors: string[]): void;
  addParticles(count: number): void;
  removeParticles(count: number): void;
}

interface SpaceOptions {
  particles?: number;
  gradient?: string[];
  speed?: number;
  size?: { min: number; max: number };
  opacity?: { min: number; max: number };
  connectionDistance?: number;
  connectionOpacity?: number;
  mouseInteraction?: boolean;
  animateConnections?: boolean;
  backgroundGradient?: boolean;
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
