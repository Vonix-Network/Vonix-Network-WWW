'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-react';
import { getUserAvatar } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface Story {
  id: number;
  userId: number;
  username: string;
  minecraftUsername: string | null;
  avatar: string | null;
  content: string;
  imageUrl: string | null;
  backgroundColor: string;
  expiresAt: Date;
  createdAt: Date;
  viewCount: number;
  hasViewed: boolean;
}

interface StoriesViewerProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
}

export default function StoriesViewer({ stories, initialIndex = 0, onClose }: StoriesViewerProps) {
  const { data: session } = useSession();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const currentStory = stories[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  const handleDelete = async () => {
    if (!confirm('Delete this story? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/social/stories/${currentStory.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Story deleted successfully');
        onClose(); // Close viewer after deletion
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete story');
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      toast.error('Failed to delete story');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!currentStory) return;

    // Mark as viewed
    if (!currentStory.hasViewed) {
      fetch(`/api/social/stories/${currentStory.id}/view`, {
        method: 'POST',
      }).catch(console.error);
    }

    // Auto-advance after 7 seconds
    const duration = 7000;
    const interval = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      setProgress((elapsed / duration) * 100);

      if (elapsed >= duration) {
        handleNext();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, currentStory, handleNext]);

  if (!currentStory) return null;
  if (typeof document === 'undefined') return null; // SSR safety

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Navigation buttons */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrevious}
          className="absolute left-4 text-white/80 hover:text-white transition-colors z-10"
        >
          <ChevronLeft className="w-12 h-12" />
        </button>
      )}
      {currentIndex < stories.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-4 text-white/80 hover:text-white transition-colors z-10"
        >
          <ChevronRight className="w-12 h-12" />
        </button>
      )}

      {/* Story content */}
      <div className="relative w-full max-w-md h-[80vh] rounded-2xl overflow-hidden shadow-2xl">
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
          {stories.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* User info */}
        <div className="absolute top-4 left-0 right-0 px-4 flex items-center gap-3 z-10">
          <img
            src={getUserAvatar(currentStory.minecraftUsername, currentStory.avatar, 64)}
            alt={currentStory.username}
            className="w-10 h-10 rounded-lg pixelated border-2 border-white/20"
          />
          <div className="flex-1">
            <p className="text-white font-semibold">{currentStory.username}</p>
            <p className="text-white/60 text-sm">
              {new Date(currentStory.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-white/80 text-sm">
              <Eye className="w-4 h-4" />
              {currentStory.viewCount}
            </div>
            {session?.user?.id && parseInt(session.user.id) === currentStory.userId && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                title="Delete story"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            )}
          </div>
        </div>

        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: currentStory.backgroundColor,
            backgroundImage: currentStory.imageUrl ? `url(${currentStory.imageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50" />

        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <p className="text-white text-2xl font-bold text-center drop-shadow-lg">
            {currentStory.content}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
