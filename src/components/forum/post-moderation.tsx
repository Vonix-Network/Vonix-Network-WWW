'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Pin, 
  PinOff, 
  Lock, 
  Unlock,
  Flag,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface PostModerationProps {
  postId: number;
  authorId: number;
  currentUserId: number;
  userRole: 'user' | 'moderator' | 'admin';
  isPinned: boolean;
  isLocked: boolean;
  categorySlug: string;
  onUpdate?: () => void;
}

export function PostModeration({
  postId,
  authorId,
  currentUserId,
  userRole,
  isPinned,
  isLocked,
  categorySlug,
  onUpdate
}: PostModerationProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user can moderate
  const canModerate = userRole === 'admin' || userRole === 'moderator';
  const canEdit = authorId === currentUserId || canModerate;
  const canDelete = authorId === currentUserId || canModerate;

  if (!canEdit && !canDelete && !canModerate) {
    return null;
  }

  const handleEdit = () => {
    router.push(`/forum/${categorySlug}/edit/${postId}`);
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      toast.success('Post deleted successfully');
      
      // Try to refresh the topic list if we're on a category page
      if ((window as any).removeForumTopic) {
        (window as any).removeForumTopic(postId);
      } else if ((window as any).refreshForumTopics) {
        (window as any).refreshForumTopics();
      } else {
        // Fallback to router navigation
        router.push(`/forum/${categorySlug}`);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };

  const handlePin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/forum/posts/${postId}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !isPinned }),
      });

      if (!response.ok) {
        throw new Error('Failed to update pin status');
      }

      toast.success(isPinned ? 'Post unpinned' : 'Post pinned');
      onUpdate?.();
    } catch (error) {
      console.error('Error updating pin status:', error);
      toast.error('Failed to update pin status');
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };

  const handleLock = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/forum/posts/${postId}/lock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: !isLocked }),
      });

      if (!response.ok) {
        throw new Error('Failed to update lock status');
      }

      toast.success(isLocked ? 'Post unlocked' : 'Post locked');
      onUpdate?.();
    } catch (error) {
      console.error('Error updating lock status:', error);
      toast.error('Failed to update lock status');
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };

  const handleReport = async () => {
    const reason = prompt('Please provide a reason for reporting this post:');
    if (!reason) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/forum/posts/${postId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to report post');
      }

      toast.success('Post reported successfully');
    } catch (error) {
      console.error('Error reporting post:', error);
      toast.error('Failed to report post');
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowMenu(!showMenu)}
        disabled={isLoading}
        className="h-8 w-8 text-gray-400 hover:text-white"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-8 z-50 min-w-[200px] rounded-lg border border-green-500/20 bg-gray-900/95 backdrop-blur-sm shadow-xl">
            {canEdit && (
              <button
                onClick={handleEdit}
                disabled={isLoading}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-blue-400 hover:bg-blue-500/10 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit Post
              </button>
            )}

            {canModerate && (
              <>
                <button
                  onClick={handlePin}
                  disabled={isLoading}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                >
                  {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  {isPinned ? 'Unpin Post' : 'Pin Post'}
                </button>

                <button
                  onClick={handleLock}
                  disabled={isLoading}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-orange-400 hover:bg-orange-500/10 transition-colors"
                >
                  {isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {isLocked ? 'Unlock Post' : 'Lock Post'}
                </button>
              </>
            )}

            {!canModerate && (
              <button
                onClick={handleReport}
                disabled={isLoading}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Flag className="h-4 w-4" />
                Report Post
              </button>
            )}

            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete Post
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
