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

interface ReplyModerationProps {
  replyId: number;
  authorId: number;
  currentUserId: number;
  userRole: 'user' | 'moderator' | 'admin';
  onUpdate?: () => void;
  onEdit?: () => void;
}

export function ReplyModeration({
  replyId,
  authorId,
  currentUserId,
  userRole,
  onUpdate,
  onEdit
}: ReplyModerationProps) {
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
    if (!confirm('Are you sure you want to delete this reply? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/forum/replies/${replyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete reply');
      }

      toast.success('Reply deleted successfully');
      
      // Try to refresh the replies list if we're on a forum post page
      if ((window as any).removeForumReply) {
        (window as any).removeForumReply(replyId);
      } else if ((window as any).refreshForumReplies) {
        (window as any).refreshForumReplies();
      } else {
        // Fallback to onUpdate callback
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast.error('Failed to delete reply');
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };

  const handleReport = async () => {
    const reason = prompt('Please provide a reason for reporting this reply:');
    if (!reason) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/forum/replies/${replyId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to report reply');
      }

      toast.success('Reply reported successfully');
    } catch (error) {
      console.error('Error reporting reply:', error);
      toast.error('Failed to report reply');
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
                Edit Reply
              </button>
            )}

            {!canModerate && (
              <button
                onClick={handleReport}
                disabled={isLoading}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Flag className="h-4 w-4" />
                Report Reply
              </button>
            )}

            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete Reply
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
