'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Trash2, Pin, Lock, Unlock, Pencil, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { ReportButton } from '@/components/shared/report-button';

interface PostActionsProps {
  postId: number;
  categorySlug: string;
  isAuthor: boolean;
  isModerator: boolean;
  isPinned: boolean;
  isLocked: boolean;
  onUpdate?: () => void;
}

export function PostActions({ 
  postId, 
  categorySlug, 
  isAuthor, 
  isModerator,
  isPinned,
  isLocked,
  onUpdate
}: PostActionsProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has any permissions to see the menu
  const hasPermissions = isAuthor || isModerator;

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
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete post');
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
      toast.error(error instanceof Error ? error.message : 'Failed to delete post');
      setIsLoading(false);
    }
  };

  const handleTogglePin = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !isPinned }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update post');
      }

      toast.success(isPinned ? 'Post unpinned' : 'Post pinned');
      onUpdate?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update post');
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };

  const handleToggleLock = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: !isLocked }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update post');
      }

      toast.success(isLocked ? 'Post unlocked' : 'Post locked');
      onUpdate?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update post');
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };


  // Show menu to everyone (for report option), but hide if no permissions
  if (!hasPermissions && !true) { // Always show for report option
    return null;
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          aria-label="Post actions"
        >
          <MoreVertical className="h-5 w-5" />
        </button>

        {showMenu && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowMenu(false)}
            />
            
            {/* Menu - Absolute positioning relative to button */}
            <div className="absolute right-0 top-8 z-50 min-w-[180px] rounded-lg border border-white/20 bg-gray-900/95 backdrop-blur-sm shadow-xl">
            {/* Edit Action (Author or Moderator) */}
            {(isAuthor || isModerator) && (
              <button
                onClick={() => router.push(`/forum/${categorySlug}/${postId}/edit`)}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-blue-400 hover:bg-blue-500/10 transition-colors w-full text-left text-sm"
              >
                <Pencil className="h-4 w-4" />
                Edit Post
              </button>
            )}

            {/* Report Option (for non-moderators/non-authors) */}
            {!isModerator && !isAuthor && (
              <div className="px-2 py-1">
                <ReportButton
                  contentType="forum_post"
                  contentId={postId}
                  className="w-full justify-start p-2 text-left text-sm"
                />
              </div>
            )}

            {/* Moderator Actions */}
            {isModerator && (
              <>
                <button
                  onClick={handleTogglePin}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 text-yellow-400 hover:bg-yellow-500/10 transition-colors w-full text-left text-sm"
                >
                  <Pin className="h-4 w-4" />
                  {isPinned ? 'Unpin Post' : 'Pin Post'}
                </button>
                <button
                  onClick={handleToggleLock}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 text-orange-400 hover:bg-orange-500/10 transition-colors w-full text-left text-sm"
                >
                  {isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {isLocked ? 'Unlock Post' : 'Lock Post'}
                </button>
              </>
            )}

            {/* Delete Action (Author or Moderator) */}
            {(isAuthor || isModerator) && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors w-full text-left text-sm ${
                  isModerator ? 'border-t border-white/10' : ''
                }`}
              >
                <Trash2 className="h-4 w-4" />
                Delete Post
              </button>
            )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
