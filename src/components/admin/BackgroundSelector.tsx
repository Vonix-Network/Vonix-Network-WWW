'use client';

import { useState, useEffect } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { BACKGROUND_OPTIONS, BackgroundType } from '../backgrounds/BackgroundManager';

/**
 * Admin component for selecting site background
 */
export default function BackgroundSelector() {
  const [currentBackground, setCurrentBackground] = useState<BackgroundType>('space');
  const [selectedBackground, setSelectedBackground] = useState<BackgroundType>('space');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch current background
    fetch('/api/settings/background')
      .then(res => res.json())
      .then(data => {
        setCurrentBackground(data.background);
        setSelectedBackground(data.background);
      })
      .catch(() => {
        toast.error('Failed to load background setting');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (selectedBackground === currentBackground) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ background: selectedBackground })
      });

      if (!response.ok) {
        throw new Error('Failed to update background');
      }

      setCurrentBackground(selectedBackground);
      toast.success('Background updated! Refresh to see changes.');
    } catch (error) {
      toast.error('Failed to update background');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-8 border border-gray-800">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-8 border border-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="h-6 w-6 text-cyan-500" />
        <h2 className="text-2xl font-bold text-white">Site Background</h2>
      </div>

      <p className="text-gray-400 mb-6">
        Choose the animated background for the entire website. Changes will take effect on page refresh.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {BACKGROUND_OPTIONS.map((option) => {
          const isSelected = selectedBackground === option.type;
          const isCurrent = currentBackground === option.type;

          return (
            <button
              key={option.type}
              onClick={() => setSelectedBackground(option.type)}
              className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}

              {isCurrent && (
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-semibold">
                    ACTIVE
                  </span>
                </div>
              )}

              <h3 className={`text-lg font-bold mb-2 ${isCurrent ? 'mt-6' : ''} ${
                isSelected ? 'text-cyan-400' : 'text-white'
              }`}>
                {option.label}
              </h3>
              <p className="text-sm text-gray-400">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Current: <span className="text-white font-semibold">
            {BACKGROUND_OPTIONS.find(o => o.type === currentBackground)?.label}
          </span>
        </p>

        <button
          onClick={handleSave}
          disabled={isSaving || selectedBackground === currentBackground}
          className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
            selectedBackground === currentBackground
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-cyan-500 hover:bg-cyan-600 text-white'
          }`}
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {selectedBackground !== currentBackground && (
        <div className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-sm text-yellow-400">
            <strong>Note:</strong> Users will need to refresh their browser to see the new background.
          </p>
        </div>
      )}
    </div>
  );
}
