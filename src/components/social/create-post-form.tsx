'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Image, Send } from 'lucide-react';
import { toast } from 'sonner';
import { showLevelUpNotification } from '@/components/xp/level-up-toast';

interface CreatePostFormProps {
  userId: number;
}

export function CreatePostForm({ userId }: CreatePostFormProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Please write something');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create post');
      }

      const data = await response.json();

      toast.success('Post created! +15 XP');
      setContent('');

      // Check for level-up and show notification
      if (data.xp?.leveledUp) {
        showLevelUpNotification({
          newLevel: data.xp.newLevel,
          xp: data.xp.totalXP,
        });
      }
      
      // Try to refresh the posts list if we're on the social page
      if ((window as any).refreshSocialPosts) {
        (window as any).refreshSocialPosts();
      } else {
        // Fallback to router refresh
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          maxLength={5000}
          disabled={isSubmitting}
          className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">
            {content.length} / 5000
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-blue-400 transition-colors"
          disabled={isSubmitting}
        >
          <Image className="h-5 w-5" />
          <span className="text-sm">Add Image (Coming Soon)</span>
        </button>

        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium overflow-hidden hover-lift glow-gradient disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center gap-2">
            {isSubmitting ? 'Posting...' : 'Post'}
            {!isSubmitting && <Send className="h-4 w-4" />}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </form>
  );
}
