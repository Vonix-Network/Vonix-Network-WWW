# Space.js - Custom Animated Space Background Library

Space.js is a custom-built animated space background library designed specifically for the Vonix Network project. It provides beautiful, interactive particle animations with easy gradient support and customizable effects.

## Features

- ✨ **Interactive Particle System** - Particles that respond to mouse movement
- 🌈 **Custom Gradient Support** - Easy color customization with predefined palettes
- 🔗 **Animated Connections** - Dynamic lines connecting nearby particles
- ⚡ **Performance Optimized** - Smooth 60fps animations with efficient rendering
- 📱 **Responsive Design** - Automatically adapts to different screen sizes
- 🎨 **Customizable Effects** - Control particle count, speed, size, opacity, and more
- 🔧 **Easy Integration** - Simple React component with TypeScript support

## Quick Start

### Basic Usage

```tsx
import SpaceBackground from '@/components/SpaceBackground';

export default function MyPage() {
  return (
    <div className="min-h-screen relative">
      <SpaceBackground />
      <div className="relative z-10">
        {/* Your content here */}
      </div>
    </div>
  );
}
```

### With Custom Configuration

```tsx
import SpaceBackground from '@/components/SpaceBackground';

export default function MyPage() {
  return (
    <div className="min-h-screen relative">
      <SpaceBackground
        particles={200}
        speed={0.8}
        gradient={['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']}
        size={{ min: 2, max: 5 }}
        opacity={{ min: 0.2, max: 0.9 }}
        connectionDistance={120}
        connectionOpacity={0.3}
        mouseInteraction={true}
        animateConnections={true}
      />
      <div className="relative z-10">
        {/* Your content here */}
      </div>
    </div>
  );
}
```

## Configuration Options

### SpaceBackground Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `particles` | `number` | `150` | Number of particles to render |
| `speed` | `number` | `0.5` | Movement speed of particles |
| `gradient` | `string[]` | Vonix colors | Array of hex colors for the gradient |
| `size` | `{min: number, max: number}` | `{min: 1, max: 3}` | Particle size range |
| `opacity` | `{min: number, max: number}` | `{min: 0.1, max: 0.8}` | Particle opacity range |
| `connectionDistance` | `number` | `100` | Maximum distance for particle connections |
| `connectionOpacity` | `number` | `0.2` | Opacity of connection lines |
| `mouseInteraction` | `boolean` | `true` | Enable mouse interaction effects |
| `animateConnections` | `boolean` | `true` | Enable animated connection lines |
| `backgroundGradient` | `boolean` | `false` | Add subtle background gradient |
| `className` | `string` | `''` | Additional CSS classes |
| `style` | `React.CSSProperties` | `{}` | Additional inline styles |

## Preset Configurations

### Space Presets

```tsx
import SpaceBackground, { SpacePresets } from '@/components/SpaceBackground';

// Subtle background - minimal distraction
<SpaceBackground {...SpacePresets.subtle} />

// Medium intensity - balanced
<SpaceBackground {...SpacePresets.medium} />

// High intensity - very interactive
<SpaceBackground {...SpacePresets.intense} />

// Minimal - very low resource usage
<SpaceBackground {...SpacePresets.minimal} />
```

### Gradient Presets

```tsx
import SpaceBackground, { GradientPresets } from '@/components/SpaceBackground';

// Vonix Network theme (default)
<SpaceBackground gradient={GradientPresets.vonix} />

// Ocean theme
<SpaceBackground gradient={GradientPresets.ocean} />

// Sunset theme
<SpaceBackground gradient={GradientPresets.sunset} />

// Fire theme
<SpaceBackground gradient={GradientPresets.fire} />

// Cool theme
<SpaceBackground gradient={GradientPresets.cool} />

// Warm theme
<SpaceBackground gradient={GradientPresets.warm} />
```

## Advanced Usage Examples

### Responsive Configuration

```tsx
import { useState, useEffect } from 'react';
import SpaceBackground from '@/components/SpaceBackground';

export default function ResponsivePage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen relative">
      <SpaceBackground
        particles={isMobile ? 50 : 150}
        speed={isMobile ? 0.3 : 0.6}
        opacity={{ min: isMobile ? 0.05 : 0.1, max: isMobile ? 0.3 : 0.6 }}
      />
      <div className="relative z-10">
        {/* Content */}
      </div>
    </div>
  );
}
```

### Conditional Rendering

```tsx
import { useState } from 'react';
import SpaceBackground from '@/components/SpaceBackground';

export default function TogglePage() {
  const [showSpace, setShowSpace] = useState(true);

  return (
    <div className="min-h-screen relative">
      {showSpace && <SpaceBackground />}
      
      <div className="relative z-10 p-8">
        <button 
          onClick={() => setShowSpace(!showSpace)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Toggle Space Background
        </button>
      </div>
    </div>
  );
}
```

### Multiple Backgrounds

```tsx
export default function MultipleBackgrounds() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative h-screen">
        <SpaceBackground {...SpacePresets.intense} />
        <div className="relative z-10 h-full flex items-center justify-center">
          <h1 className="text-6xl font-bold text-white">Hero Section</h1>
        </div>
      </section>

      {/* Content Section */}
      <section className="relative h-96">
        <SpaceBackground {...SpacePresets.subtle} />
        <div className="relative z-10 h-full flex items-center justify-center">
          <h2 className="text-4xl font-bold text-white">Content Section</h2>
        </div>
      </section>
    </div>
  );
}
```

### Custom Styling

```tsx
export default function StyledPage() {
  return (
    <div className="min-h-screen relative">
      <SpaceBackground 
        className="brightness-75 contrast-125"
        style={{ filter: 'hue-rotate(30deg)' }}
      />
      <div className="relative z-10">
        {/* Content */}
      </div>
    </div>
  );
}
```

## Performance Optimization

### Best Practices

1. **Use appropriate particle counts**:
   - Mobile: 30-80 particles
   - Desktop: 100-200 particles
   - High-end: 200-300 particles

2. **Optimize for different use cases**:
   - Background: Use `SpacePresets.subtle` or `SpacePresets.minimal`
   - Hero sections: Use `SpacePresets.medium` or `SpacePresets.intense`
   - Interactive areas: Enable `mouseInteraction`

3. **Consider device capabilities**:
   ```tsx
   const getOptimalConfig = () => {
     const isLowEnd = navigator.hardwareConcurrency <= 2;
     const isMobile = window.innerWidth < 768;
     
     if (isLowEnd || isMobile) {
       return SpacePresets.minimal;
     }
     return SpacePresets.medium;
   };
   ```

### Memory Management

The Space.js library automatically handles:
- Canvas resizing on window resize
- Animation frame cleanup on component unmount
- Particle recycling for optimal memory usage

## Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## Troubleshooting

### Common Issues

1. **Canvas not rendering**:
   - Ensure the parent container has a defined height
   - Check that the canvas element is properly mounted

2. **Performance issues**:
   - Reduce particle count
   - Disable mouse interaction
   - Use minimal preset

3. **Gradient not showing**:
   - Verify color format (use hex colors like `#ff0000`)
   - Check that gradient array has at least 2 colors

### Debug Mode

```tsx
<SpaceBackground
  particles={50}
  speed={0.1}
  // ... other props
  style={{ border: '1px solid red' }} // Visual debug
/>
```

## Integration with Vonix Network

The Space.js library is already integrated into the following Vonix Network pages:

- **Homepage** (`/`) - High-intensity space background with full interactivity
- **Public Layout** - Medium-intensity background for public pages
- **Dashboard Layout** - Subtle background for dashboard pages
- **Auth Pages** - Minimal background for login/register pages

### Current Implementations

```tsx
// Homepage - Hero experience
<SpaceBackground 
  particles={180}
  speed={0.7}
  gradient={['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#ef4444']}
  size={{ min: 1.2, max: 4 }}
  opacity={{ min: 0.12, max: 0.8 }}
  connectionDistance={140}
  connectionOpacity={0.25}
  mouseInteraction={true}
  animateConnections={true}
/>

// Dashboard - Subtle background
<SpaceBackground 
  particles={100}
  speed={0.4}
  gradient={['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#ef4444']}
  size={{ min: 1, max: 2.5 }}
  opacity={{ min: 0.08, max: 0.5 }}
  connectionDistance={100}
  connectionOpacity={0.15}
  mouseInteraction={true}
  animateConnections={true}
/>

// Auth pages - Minimal distraction
<SpaceBackground 
  particles={60}
  speed={0.25}
  gradient={['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#ef4444']}
  size={{ min: 0.8, max: 1.5 }}
  opacity={{ min: 0.03, max: 0.3 }}
  connectionDistance={60}
  connectionOpacity={0.08}
  mouseInteraction={true}
  animateConnections={true}
/>
```

## Customization Examples

### Creating Custom Themes

```tsx
// Cyberpunk theme
const cyberpunkTheme = {
  particles: 200,
  speed: 1.2,
  gradient: ['#00ff88', '#0088ff', '#8800ff', '#ff0088'],
  size: { min: 1, max: 4 },
  opacity: { min: 0.3, max: 0.9 },
  connectionDistance: 150,
  connectionOpacity: 0.4,
  mouseInteraction: true,
  animateConnections: true,
};

// Zen theme
const zenTheme = {
  particles: 40,
  speed: 0.2,
  gradient: ['#4a5568', '#718096', '#a0aec0'],
  size: { min: 0.5, max: 2 },
  opacity: { min: 0.05, max: 0.3 },
  connectionDistance: 80,
  connectionOpacity: 0.1,
  mouseInteraction: false,
  animateConnections: false,
};
```

## Future Enhancements

Planned features for future versions:

- 🌟 **Star field effects** - Background star patterns
- 🎆 **Explosion effects** - Particle burst animations
- 🌊 **Wave patterns** - Flowing particle movements
- 🎨 **Theme switching** - Dynamic theme changes
- 📊 **Performance metrics** - Built-in performance monitoring
- 🎮 **Game integration** - Minecraft-themed particle effects

## Contributing

To contribute to Space.js development:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Space.js is part of the Vonix Network project and follows the same licensing terms.

---

*Space.js - Bringing the universe to your web applications* ✨
