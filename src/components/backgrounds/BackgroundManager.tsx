'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import SpaceBackground from '../SpaceBackground';

// Dynamically import backgrounds - load immediately for instant display
const MatrixRain = dynamic(() => import('./MatrixRain'), { 
  loading: () => <div className="absolute inset-0 bg-gray-950" style={{ zIndex: -1 }} />
});
const PixelStars = dynamic(() => import('./PixelStars'), {
  loading: () => <div className="absolute inset-0 bg-gray-950" style={{ zIndex: -1 }} />
});
const NeuralNet = dynamic(() => import('./NeuralNet'), {
  loading: () => <div className="absolute inset-0 bg-gray-950" style={{ zIndex: -1 }} />
});
const DataStream = dynamic(() => import('./DataStream'), {
  loading: () => <div className="absolute inset-0 bg-gray-950" style={{ zIndex: -1 }} />
});

export type BackgroundType = 'space' | 'matrix' | 'pixels' | 'neural' | 'data' | 'none';

export interface BackgroundConfig {
  type: BackgroundType;
  label: string;
  description: string;
  preview?: string;
}

export const BACKGROUND_OPTIONS: BackgroundConfig[] = [
  {
    type: 'space',
    label: 'Space Particles (Classic)',
    description: 'Original particle system with connections'
  },
  {
    type: 'matrix',
    label: 'Matrix Rain',
    description: 'Digital rain effect with Minecraft characters'
  },
  {
    type: 'data',
    label: 'Data Stream',
    description: 'Flowing binary code streams'
  },
  {
    type: 'pixels',
    label: 'Pixel Stars',
    description: 'Retro pixelated starfield'
  },
  {
    type: 'neural',
    label: 'Neural Network',
    description: 'Interconnected nodes with mouse interaction'
  },
  {
    type: 'none',
    label: 'None',
    description: 'Solid dark background'
  }
];

interface BackgroundManagerProps {
  type?: BackgroundType;
  className?: string;
}

/**
 * Unified background manager
 * Renders the selected background type
 */
export default function BackgroundManager({
  type: initialType,
  className = ''
}: BackgroundManagerProps) {
  const [backgroundType, setBackgroundType] = useState<BackgroundType>(initialType || 'space');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Resolve effective background if not provided:
    // 1) User preferred background (if logged in)
    // 2) Site default background
    if (!initialType) {
      const fetchUser = fetch('/api/user/background').then(r => r.ok ? r.json() : { preferredBackground: null }).catch(() => ({ preferredBackground: null }));
      const fetchSite = fetch('/api/settings/background').then(r => r.ok ? r.json() : { background: 'space' }).catch(() => ({ background: 'space' }));

      Promise.all([fetchUser, fetchSite])
        .then(([u, s]) => {
          const userChoice = (u?.preferredBackground ?? null) as BackgroundType | null;
          const siteChoice = (s?.background ?? 'space') as BackgroundType;
          setBackgroundType(userChoice ?? siteChoice);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [initialType]);

  if (isLoading) {
    return <div className={`absolute inset-0 bg-gray-950 ${className}`} style={{ zIndex: -1 }} />;
  }

  // Component remounts via BackgroundWrapper's key prop
  switch (backgroundType) {
    case 'matrix':
      return <MatrixRain className={className} />;
    
    case 'data':
      return <DataStream className={className} />;
    
    case 'pixels':
      return <PixelStars className={className} />;
    
    case 'neural':
      return <NeuralNet className={className} />;
    
    case 'none':
      return <div className={`absolute inset-0 bg-gray-950 ${className}`} style={{ zIndex: -1 }} />;
    
    case 'space':
    default:
      return (
        <SpaceBackground
          className={className}
          preset="medium"
          gradientTheme="vonix"
        />
      );
  }
}
