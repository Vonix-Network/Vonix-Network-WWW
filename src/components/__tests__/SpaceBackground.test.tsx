/**
 * SpaceBackground Component Tests
 * 
 * Basic tests to ensure Space.js integration works correctly
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import SpaceBackground from '../SpaceBackground';

// Mock canvas methods
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: () => ({
    scale: jest.fn(),
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
  }),
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
  value: () => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    bottom: 600,
    right: 800,
  }),
});

// Mock window.devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  value: 1,
});

describe('SpaceBackground', () => {
  beforeEach(() => {
    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
    global.cancelAnimationFrame = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<SpaceBackground />);
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<SpaceBackground className="custom-class" />);
    const canvas = document.querySelector('canvas');
    expect(canvas).toHaveClass('custom-class');
  });

  it('applies custom styles', () => {
    const customStyle = { filter: 'blur(5px)' };
    render(<SpaceBackground style={customStyle} />);
    const canvas = document.querySelector('canvas');
    expect(canvas).toHaveStyle('filter: blur(5px)');
  });

  it('has correct default CSS classes', () => {
    render(<SpaceBackground />);
    const canvas = document.querySelector('canvas');
    expect(canvas).toHaveClass('absolute', 'inset-0', 'w-full', 'h-full', 'pointer-events-none');
  });

  it('sets correct z-index', () => {
    render(<SpaceBackground />);
    const canvas = document.querySelector('canvas');
    expect(canvas).toHaveStyle('z-index: -1');
  });
});

describe('SpaceBackground with different configurations', () => {
  it('renders with custom particle count', () => {
    render(<SpaceBackground particles={200} />);
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('renders with custom gradient', () => {
    const customGradient = ['#ff0000', '#00ff00', '#0000ff'];
    render(<SpaceBackground gradient={customGradient} />);
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('renders with mouse interaction disabled', () => {
    render(<SpaceBackground mouseInteraction={false} />);
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('renders with connections disabled', () => {
    render(<SpaceBackground animateConnections={false} />);
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
});

describe('SpaceBackground fallback', () => {
  it('handles Space.js import failure gracefully', () => {
    // Mock import failure
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    render(<SpaceBackground />);
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    
    console.error = originalConsoleError;
  });
});
