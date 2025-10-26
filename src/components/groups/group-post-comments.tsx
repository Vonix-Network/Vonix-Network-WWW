'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Comment {
  id: number;
  content: string;
  likesCount: number;
  createdAt: Date;
  author: {
    id: number;
    username: string;
    minecraftUsername: string | null;
    avatar: string | null;
    role: string;
  };
}

interface GroupPostCommentsProps {
  groupId: number;
  postId: number;
  userRole: 'admin' | 'moderator' | 'member' | null;
  onCommentAdded?: () => void;
}

function getUserAvatar(minecraftUsername?: string | null, avatar?: string | null, size: number = 64): string {
  if (minecraftUsername) {
    return `https://mc-heads.net/head/${minecraftUsername}/${size}`;
  }
  if (avatar) {
    return avatar;
  }
  return `https://mc-heads.net/head/steve/${size}`;
}

export function GroupPostComments({ groupId, postId, userRole, onCommentAdded }: GroupPostCommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/posts/${postId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      
      const data = await response.json();
      setComments(data.comments);
    } catch (error) {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [groupId, postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) throw new Error('Failed to create comment');

      toast.success('Comment added');
      setNewComment('');
      fetchComments();
      onCommentAdded?.();
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Delete this comment?')) return;

    try {
      const response = await fetch(`/api/groups/${groupId}/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete comment');

      toast.success('Comment deleted');
      fetchComments();
      onCommentAdded?.();
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const canModerate = userRole === 'admin' || userRole === 'moderator' || session?.user?.role === 'admin' || session?.user?.role === 'moderator';

  return (
    <div className="mt-4 pt-4 border-t border-slate-700">
      {/* Comment Form */}
      {userRole && (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-3">
            <img
              src={getUserAvatar(session?.user?.minecraftUsername, session?.user?.avatar, 32)}
              alt="Your avatar"
              className="w-8 h-8 rounded-lg pixelated"
            />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                maxLength={2000}
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-4 text-slate-400 text-sm">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4 text-slate-500 text-sm">No comments yet</div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const isAuthor = session?.user?.id ? Number(session.user.id) === comment.author.id : false;
            const canDelete = isAuthor || canModerate;

            return (
              <div key={comment.id} className="flex gap-3 group">
                <img
                  src={getUserAvatar(comment.author.minecraftUsername, comment.author.avatar, 32)}
                  alt={comment.author.username}
                  className="w-8 h-8 rounded-lg pixelated flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="bg-slate-800/50 rounded-lg px-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white text-sm">{comment.author.username}</span>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 px-4">
                    {new Date(comment.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
