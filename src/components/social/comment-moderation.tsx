'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Flag,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface CommentModerationProps {
  commentId: number;
  authorId: number;
  currentUserId: number;
  userRole: 'user' | 'moderator' | 'admin';
  isHidden?: boolean;
  onUpdate?: () => void;
  onEdit?: () => void;
}

export function CommentModeration({
  commentId,
  authorId,
  currentUserId,
  userRole,
  isHidden = false,
  onUpdate,
  onEdit
}: CommentModerationProps) {
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
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/social/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      toast.success('Comment deleted successfully');
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };

  const handleHide = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/social/comments/${commentId}/hide`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden: !isHidden }),
      });

      if (!response.ok) {
        throw new Error('Failed to update visibility');
      }

      toast.success(isHidden ? 'Comment shown' : 'Comment hidden');
      onUpdate?.();
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };

  const handleReport = async () => {
    const reason = prompt('Please provide a reason for reporting this comment:');
    if (!reason) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/social/comments/${commentId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to report comment');
      }

      toast.success('Comment reported successfully');
    } catch (error) {
      console.error('Error reporting comment:', error);
      toast.error('Failed to report comment');
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
        className="h-6 w-6 text-gray-400 hover:text-white"
      >
        <MoreVertical className="h-3 w-3" />
      </Button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-6 z-50 min-w-[180px] rounded-lg border border-green-500/20 bg-gray-900/95 backdrop-blur-sm shadow-xl">
            {canEdit && (
              <button
                onClick={handleEdit}
                disabled={isLoading}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-blue-400 hover:bg-blue-500/10 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit Comment
              </button>
            )}

            {canModerate && (
              <button
                onClick={handleHide}
                disabled={isLoading}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-orange-400 hover:bg-orange-500/10 transition-colors"
              >
                {isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {isHidden ? 'Show Comment' : 'Hide Comment'}
              </button>
            )}

            {!canModerate && (
              <button
                onClick={handleReport}
                disabled={isLoading}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Flag className="h-4 w-4" />
                Report Comment
              </button>
            )}

            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete Comment
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
