'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Flag,
  Eye,
  EyeOff,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { ReportButton } from '@/components/shared/report-button';

interface PostModerationProps {
  postId: number;
  authorId: number;
  currentUserId: number;
  userRole: 'user' | 'moderator' | 'admin';
  isHidden?: boolean;
  onUpdate?: () => void;
  onEdit?: () => void;
}

export function PostModeration({
  postId,
  authorId,
  currentUserId,
  userRole,
  isHidden = false,
  onUpdate,
  onEdit
}: PostModerationProps) {
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
    onEdit?.();
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/social/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      toast.success('Post deleted successfully');
      
      // Try to refresh the posts list if we're on the social page
      if ((window as any).removeSocialPost) {
        (window as any).removeSocialPost(postId);
      } else if ((window as any).refreshSocialPosts) {
        (window as any).refreshSocialPosts();
      } else {
        // Fallback to onUpdate callback
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };

  const handleHide = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/social/posts/${postId}/hide`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden: !isHidden }),
      });

      if (!response.ok) {
        throw new Error('Failed to update visibility');
      }

      toast.success(isHidden ? 'Post shown' : 'Post hidden');
      onUpdate?.();
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
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
          <div className="absolute right-0 top-8 z-50 min-w-[180px] rounded-lg border border-green-500/20 bg-gray-900/95 backdrop-blur-sm shadow-xl">
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
              <button
                onClick={handleHide}
                disabled={isLoading}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-orange-400 hover:bg-orange-500/10 transition-colors"
              >
                {isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {isHidden ? 'Show Post' : 'Hide Post'}
              </button>
            )}

            {!canModerate && authorId !== currentUserId && (
              <div className="px-2 py-1">
                <ReportButton
                  contentType="social_post"
                  contentId={postId}
                  className="w-full justify-start p-2 text-left text-sm"
                />
              </div>
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
