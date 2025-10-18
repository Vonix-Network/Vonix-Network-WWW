# Space.js - Custom Animated Space Background Library

A lightweight, customizable animated space background library built specifically for the Vonix Network project. Features interactive particle systems with gradient support and smooth 60fps animations.

## 🌟 Features

- **Interactive Particles** - Mouse-responsive particle system
- **Custom Gradients** - Easy color customization with predefined themes
- **Animated Connections** - Dynamic lines connecting nearby particles
- **Performance Optimized** - Smooth animations with efficient rendering
- **Responsive Design** - Automatically adapts to screen sizes
- **TypeScript Support** - Full type definitions included
- **React Integration** - Easy-to-use React component

## 🚀 Quick Start

```tsx
import SpaceBackground from '@/components/SpaceBackground';

export default function MyPage() {
  return (
    <div className="min-h-screen relative">
      <SpaceBackground />
      <div className="relative z-10">
        {/* Your content */}
      </div>
    </div>
  );
}
```

## 📦 Installation

Space.js is already included in the Vonix Network project. No additional installation required.

## 🎨 Customization

### Basic Configuration

```tsx
<SpaceBackground
  particles={200}
  speed={0.8}
  gradient={['#3b82f6', '#8b5cf6', '#ec4899']}
  size={{ min: 1, max: 4 }}
  opacity={{ min: 0.1, max: 0.8 }}
  mouseInteraction={true}
  animateConnections={true}
/>
```

### Using Presets

```tsx
import SpaceBackground, { SpacePresets, GradientPresets } from '@/components/SpaceBackground';

// Use predefined configurations
<SpaceBackground {...SpacePresets.intense} />
<SpaceBackground gradient={GradientPresets.ocean} />
```

## 📚 Documentation

- [Complete Guide](./SPACE_JS_GUIDE.md) - Comprehensive documentation
- [Examples](./space-examples.tsx) - Usage examples and patterns
- [Type Definitions](./space.d.ts) - TypeScript definitions

## 🎯 Use Cases

- **Hero Sections** - Eye-catching animated backgrounds
- **Landing Pages** - Engaging visual experiences
- **Dashboard Backgrounds** - Subtle animated effects
- **Loading Screens** - Dynamic waiting experiences
- **Gaming Interfaces** - Immersive visual environments

## ⚡ Performance

- Optimized for 60fps animations
- Automatic canvas resizing
- Memory-efficient particle management
- Graceful fallback for older browsers

## 🔧 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📄 License

Part of the Vonix Network project. See main project license for details.

---

*Built with ❤️ for the Vonix Network community*
