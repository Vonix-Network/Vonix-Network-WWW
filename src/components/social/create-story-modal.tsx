'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Image as ImageIcon, Palette } from 'lucide-react';
import { toast } from 'sonner';

interface CreateStoryModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BACKGROUND_COLORS = [
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Green', value: '#10b981' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Black', value: '#000000' },
];

export default function CreateStoryModal({ show, onClose, onSuccess }: CreateStoryModalProps) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#8b5cf6');
  const [loading, setLoading] = useState(false);

  if (!show) return null;
  if (typeof document === 'undefined') return null; // SSR safety

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Please enter story content');
      return;
    }

    if (content.length > 500) {
      toast.error('Story content must be 500 characters or less');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/social/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          imageUrl: imageUrl.trim() || null,
          backgroundColor,
        }),
      });

      if (res.ok) {
        toast.success('Story created! Expires in 24 hours');
        setContent('');
        setImageUrl('');
        setBackgroundColor('#8b5cf6');
        onSuccess();
        onClose();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to create story');
      }
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error('Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg mx-4 bg-gray-900 border border-purple-500/50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Create Story
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Share a moment that lasts 24 hours
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Story Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={500}
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              disabled={loading}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">Max 500 characters</span>
              <span className={`text-xs ${content.length > 450 ? 'text-red-400' : 'text-gray-500'}`}>
                {content.length}/500
              </span>
            </div>
          </div>

          {/* Background Color */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Background Color
            </label>
            <div className="grid grid-cols-4 gap-3">
              {BACKGROUND_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setBackgroundColor(color.value)}
                  className={`h-12 rounded-lg border-2 transition-all ${
                    backgroundColor === color.value
                      ? 'border-white scale-105 shadow-lg'
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: color.value }}
                  disabled={loading}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Image URL (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Image URL (Optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-2">
              Optional: Add a background image URL
            </p>
          </div>

          {/* Preview */}
          {content && (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Preview
              </label>
              <div
                className="relative h-32 rounded-lg overflow-hidden"
                style={{
                  backgroundColor,
                  backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50" />
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <p className="text-white text-center font-semibold line-clamp-3">
                    {content}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Story'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
