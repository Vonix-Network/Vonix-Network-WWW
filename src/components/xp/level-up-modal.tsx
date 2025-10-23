'use client';

import { useEffect, useState } from 'react';
import { X, Star, Award, TrendingUp } from 'lucide-react';
import { getTitleForLevel, getColorForLevel } from '@/lib/xp-utils';

interface LevelUpModalProps {
  show: boolean;
  newLevel: number;
  oldLevel: number;
  reward?: {
    title?: string;
    badge?: string;
    description?: string;
  };
  onClose: () => void;
}

export default function LevelUpModal({ show, newLevel, oldLevel, reward, onClose }: LevelUpModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      
      // Trigger confetti animation (works without package, just won't animate)
      const triggerConfetti = async () => {
        try {
          // Dynamic import to avoid build errors if package not installed
          // @ts-ignore - Optional dependency, gracefully handles if not installed
          const confettiModule = await import('canvas-confetti').catch(() => null);
          if (!confettiModule) return;
          
          const confetti = confettiModule.default as any;
          const duration = 3000;
          const end = Date.now() + duration;

          const frame = () => {
            confetti({
              particleCount: 2,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: ['#8b5cf6', '#06FFA5', '#00D9FF'],
            });
            confetti({
              particleCount: 2,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: ['#8b5cf6', '#06FFA5', '#00D9FF'],
            });

            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          };
          frame();
        } catch {
          // Silently skip if confetti not available
        }
      };
      
      triggerConfetti();
    }
  }, [show]);

  if (!visible) return null;

  const title = reward?.title || getTitleForLevel(newLevel);
  const levelColor = getColorForLevel(newLevel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg mx-4 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 border border-purple-500/50 rounded-2xl shadow-2xl shadow-purple-500/20 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 animate-pulse" />

        {/* Content */}
        <div className="relative p-8 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full blur-2xl opacity-50 animate-pulse" />
              <div className="relative bg-gradient-to-br from-purple-600 to-cyan-600 w-24 h-24 rounded-full flex items-center justify-center">
                <TrendingUp className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Level Up!
            </h2>
            <p className="text-gray-400">
              You've reached a new milestone
            </p>
          </div>

          {/* Level Display */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Previous</p>
              <div className="px-6 py-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <span className="text-3xl font-bold" style={{ color: getColorForLevel(oldLevel) }}>
                  {oldLevel}
                </span>
              </div>
            </div>

            <div className="text-purple-400">
              <Star className="w-8 h-8" />
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">New Level</p>
              <div className="px-6 py-3 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg border border-purple-500">
                <span className="text-3xl font-bold" style={{ color: levelColor }}>
                  {newLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Title & Badge */}
          <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-6 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              <p className="text-sm text-gray-400 font-semibold">New Title</p>
            </div>
            <div className="flex items-center justify-center gap-3">
              {reward?.badge && <span className="text-3xl">{reward.badge}</span>}
              <h3 className="text-2xl font-bold" style={{ color: levelColor }}>
                {title}
              </h3>
            </div>
            {reward?.description && (
              <p className="text-gray-400 text-sm">{reward.description}</p>
            )}
          </div>

          {/* Continue button */}
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
