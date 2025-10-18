/**
 * Space.js Usage Examples
 * 
 * This file demonstrates various ways to use the Space.js library
 * in your Vonix Network application.
 */

import SpaceBackground, { SpacePresets, GradientPresets } from '../components/SpaceBackground';

// Example 1: Basic usage with default Vonix gradient
export function BasicSpaceExample() {
  return (
    <div className="relative min-h-screen">
      <SpaceBackground />
      <div className="relative z-10 p-8">
        <h1 className="text-white text-4xl font-bold">Your Content Here</h1>
        <p className="text-gray-300 mt-4">The space background will animate behind this content.</p>
      </div>
    </div>
  );
}

// Example 2: Custom configuration
export function CustomSpaceExample() {
  return (
    <div className="relative min-h-screen">
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
        backgroundGradient={true}
      />
      <div className="relative z-10 p-8">
        <h1 className="text-white text-4xl font-bold">Custom Space Background</h1>
        <p className="text-gray-300 mt-4">Highly interactive with custom colors and settings.</p>
      </div>
    </div>
  );
}

// Example 3: Using presets
export function PresetSpaceExample() {
  return (
    <div className="relative min-h-screen">
      <SpaceBackground {...SpacePresets.subtle} />
      <div className="relative z-10 p-8">
        <h1 className="text-white text-4xl font-bold">Subtle Space Background</h1>
        <p className="text-gray-300 mt-4">Using the subtle preset for minimal distraction.</p>
      </div>
    </div>
  );
}

// Example 4: Different gradient presets
export function GradientPresetExample() {
  return (
    <div className="relative min-h-screen">
      <SpaceBackground gradient={GradientPresets.ocean} />
      <div className="relative z-10 p-8">
        <h1 className="text-white text-4xl font-bold">Ocean Theme</h1>
        <p className="text-gray-300 mt-4">Using the ocean gradient preset.</p>
      </div>
    </div>
  );
}

// Example 5: Multiple space backgrounds on one page
export function MultipleSpaceExample() {
  return (
    <div className="space-y-8">
      {/* Section 1 */}
      <div className="relative h-96">
        <SpaceBackground {...SpacePresets.minimal} gradient={GradientPresets.cool} />
        <div className="relative z-10 p-8 h-full flex items-center justify-center">
          <h2 className="text-white text-2xl font-bold">Cool Minimal Space</h2>
        </div>
      </div>

      {/* Section 2 */}
      <div className="relative h-96">
        <SpaceBackground {...SpacePresets.intense} gradient={GradientPresets.fire} />
        <div className="relative z-10 p-8 h-full flex items-center justify-center">
          <h2 className="text-white text-2xl font-bold">Intense Fire Space</h2>
        </div>
      </div>
    </div>
  );
}

// Example 6: Space background with overlay content
export function OverlaySpaceExample() {
  return (
    <div className="relative min-h-screen">
      <SpaceBackground />
      
      {/* Overlay content with backdrop blur */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      
      <div className="relative z-10 p-8 h-full flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h1 className="text-white text-4xl font-bold mb-4">Glassmorphism Card</h1>
          <p className="text-gray-300">
            This card has a glassmorphism effect over the space background.
          </p>
        </div>
      </div>
    </div>
  );
}

// Example 7: Responsive space background
export function ResponsiveSpaceExample() {
  return (
    <div className="relative min-h-screen">
      <SpaceBackground
        className="md:opacity-100 opacity-50"
        particles={window.innerWidth > 768 ? 200 : 100}
        speed={window.innerWidth > 768 ? 0.8 : 0.3}
      />
      <div className="relative z-10 p-8">
        <h1 className="text-white text-4xl font-bold">Responsive Space</h1>
        <p className="text-gray-300 mt-4">
          Different settings for mobile vs desktop.
        </p>
      </div>
    </div>
  );
}

// Example 8: Space background with conditional rendering
export function ConditionalSpaceExample({ showSpace }: { showSpace: boolean }) {
  return (
    <div className="relative min-h-screen">
      {showSpace && <SpaceBackground />}
      
      <div className="relative z-10 p-8">
        <h1 className="text-white text-4xl font-bold">
          {showSpace ? 'Space Background Active' : 'No Space Background'}
        </h1>
        <p className="text-gray-300 mt-4">
          Toggle the space background on and off.
        </p>
      </div>
    </div>
  );
}

// Example 9: Space background with custom CSS classes
export function CustomClassSpaceExample() {
  return (
    <div className="relative min-h-screen">
      <SpaceBackground 
        className="brightness-75 contrast-125"
        style={{ filter: 'hue-rotate(30deg)' }}
      />
      <div className="relative z-10 p-8">
        <h1 className="text-white text-4xl font-bold">Custom Styled Space</h1>
        <p className="text-gray-300 mt-4">
          Space background with custom CSS filters applied.
        </p>
      </div>
    </div>
  );
}

// Example 10: Space background for specific sections
export function SectionSpaceExample() {
  return (
    <div>
      {/* Hero section with space background */}
      <section className="relative h-screen">
        <SpaceBackground {...SpacePresets.intense} />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-white text-6xl font-bold mb-4">Vonix Network</h1>
            <p className="text-gray-300 text-xl">Your Minecraft Community</p>
          </div>
        </div>
      </section>

      {/* Regular content section */}
      <section className="bg-gray-900 py-16">
        <div className="container mx-auto px-8">
          <h2 className="text-white text-3xl font-bold mb-8">Regular Content</h2>
          <p className="text-gray-300">
            This section doesn't have a space background, just regular content.
          </p>
        </div>
      </section>

      {/* Footer with subtle space background */}
      <footer className="relative h-64">
        <SpaceBackground {...SpacePresets.subtle} />
        <div className="relative z-10 h-full flex items-center justify-center">
          <p className="text-white">&copy; 2024 Vonix Network</p>
        </div>
      </footer>
    </div>
  );
}
