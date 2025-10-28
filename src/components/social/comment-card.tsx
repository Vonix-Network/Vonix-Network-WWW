'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Reply, MoreVertical, Edit, Trash2, Send, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { formatTimeAgo } from '@/lib/date-utils';

interface Comment {
  id: number;
  content: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  parentCommentId: number | null;
  likesCount: number;
  userId: number;
  author: {
    id: number;
    username: string;
    minecraftUsername?: string;
    avatar?: string;
    role: string;
    donationRankId?: string;
  };
  replies?: Comment[];
}

interface DonationRank {
  id: string;
  name: string;
  color: string;
  textColor: string;
  badge?: string;
}

interface CommentCardProps {
  comment: Comment;
  postId: number;
  currentUserId?: number;
  onCommentDeleted: (commentId: number) => void;
  onReplyAdded: (parentId: number, reply: Comment) => void;
  level?: number;
}

export function CommentCard({ 
  comment, 
  postId,
  currentUserId, 
  onCommentDeleted,
  onReplyAdded,
  level = 0 
}: CommentCardProps) {
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likesCount);
  const [donationRank, setDonationRank] = useState<DonationRank | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isLoadingLikeStatus, setIsLoadingLikeStatus] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isUpdating, setIsUpdating] = useState(false);

  const isAuthor = currentUserId === comment.userId;

  // Fetch like status if user is logged in
  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/social/comments/${comment.id}/like/status`)
        .then(res => res.json())
        .then(data => {
          setIsLiked(data.isLiked);
          setIsLoadingLikeStatus(false);
        })
        .catch(err => {
          console.error('Error fetching like status:', err);
          setIsLoadingLikeStatus(false);
        });
    } else {
      setIsLoadingLikeStatus(false);
    }
  }, [comment.id, session?.user?.id]);

  // Fetch donation rank if user has one
  useEffect(() => {
    if (comment.author?.donationRankId) {
      fetch('/api/donor-ranks')
        .then(res => res.json())
        .then(ranks => {
          const rank = ranks.find((r: DonationRank) => r.id === comment.author.donationRankId);
          if (rank) setDonationRank(rank);
        })
        .catch(console.error);
    }
  }, [comment.author?.donationRankId]);
  const canModerate = session?.user?.role === 'admin' || session?.user?.role === 'moderator';
  const maxNestingLevel = 2;

  const handleLike = async () => {
    if (isLiking || !session) return;
    
    setIsLiking(true);
    const previousState = isLiked;
    const previousCount = likesCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

    try {
      const response = await fetch(`/api/social/comments/${comment.id}/like`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to toggle like');
      
      const data = await response.json();
      setIsLiked(data.isLiked);
      setLikesCount(data.likesCount);
    } catch (error) {
      // Revert optimistic update
      setIsLiked(previousState);
      setLikesCount(previousCount);
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    } finally {
      setIsLiking(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    if (!session) {
      toast.error('Please log in to reply');
      return;
    }

    setIsSubmittingReply(true);
    try {
      const response = await fetch(`/api/social/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parent_comment_id: comment.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post reply');
      }

      const data = await response.json();
      setReplyContent('');
      setShowReplyForm(false);
      onReplyAdded(comment.id, data.comment);
      toast.success('Reply posted!');
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to post reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/social/comments/${comment.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete comment');
      
      onCommentDeleted(comment.id);
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editContent.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/social/comments/${comment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to update comment');
      
      setIsEditing(false);
      toast.success('Comment updated');
      // Note: In a real app, you'd want to refresh the comment data
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={`${level > 0 ? 'ml-8 border-l-2 border-blue-500/20 pl-4' : ''}`}>
      <Card className={`glass border-blue-500/10 ${level > 0 ? 'bg-black/10' : ''}`}>
        <CardContent className="p-4">
          {/* Comment Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar 
                username={comment.author?.username || 'Unknown'} 
                minecraftUsername={comment.author?.minecraftUsername}
                avatar={comment.author?.avatar}
                size="sm"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span 
                    className="font-medium"
                    style={{
                      color: donationRank
                        ? (donationRank.textColor !== '#000000' && donationRank.textColor !== '#000'
                          ? donationRank.textColor
                          : '#e5e7eb')
                        : '#e5e7eb'
                    }}
                  >
                    {comment.author?.username || 'Unknown'}
                  </span>
                  <Badge variant={comment.author?.role === 'admin' ? 'destructive' : 'secondary'}>
                    {comment.author?.role || 'user'}
                  </Badge>
                  {donationRank && (
                    <Badge 
                      variant="outline" 
                      className="flex items-center gap-1 text-xs"
                      style={{
                        backgroundColor: donationRank.color + '20',
                        color: (donationRank.textColor !== '#000000' && donationRank.textColor !== '#000') ? donationRank.textColor : '#ffffff',
                        borderColor: donationRank.color + '60',
                      }}
                    >
                      <Crown className="h-3 w-3" />
                      {donationRank.badge || donationRank.name}
                    </Badge>
                  )}
                  {level > 0 && (
                    <Badge variant="outline" className="text-xs border-green-500/30">
                      Reply
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {formatTimeAgo(new Date(comment.createdAt))}
                  {comment.updatedAt !== comment.createdAt && (
                    <span className="ml-2">(edited)</span>
                  )}
                </span>
              </div>
            </div>

            {/* Actions Menu */}
            {(isAuthor || canModerate) && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 glass border border-green-500/20 rounded-lg overflow-hidden z-10">
                    {isAuthor && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-green-500/10 w-full justify-start"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 w-full justify-start"
                    >
                      <Trash2 className="h-3 w-3" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comment Content */}
          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-3 mb-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="bg-black/20 border-green-500/20 focus:border-green-500/40"
                maxLength={2000}
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUpdating}
                  className="bg-green-500/20 text-green-400 hover:bg-green-500/30"
                >
                  {isUpdating ? 'Updating...' : 'Update'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="mb-3">
              <p className="text-gray-300 whitespace-pre-wrap">{comment.content}</p>
            </div>
          )}

          {/* Comment Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking || !session}
              className={`flex items-center gap-1 ${
                isLiked
                  ? 'text-red-400 hover:text-red-300'
                  : 'text-gray-400 hover:text-red-400'
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs">{likesCount}</span>
            </Button>

            {level < maxNestingLevel && session && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center gap-1 text-gray-400 hover:text-green-400"
              >
                <Reply className="h-4 w-4" />
                <span className="text-xs">Reply</span>
              </Button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-4 pt-4 border-t border-green-500/10">
              <form onSubmit={handleReply} className="space-y-3">
                <div className="flex gap-3">
                  <Avatar 
                    username={session?.user?.name || 'User'} 
                    minecraftUsername={session?.user?.minecraftUsername}
                    avatar={session?.user?.avatar}
                    size="sm"
                  />
                  <div className="flex-1">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      className="min-h-[60px] resize-none bg-black/20 border-green-500/20 focus:border-green-500/40"
                      maxLength={2000}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {replyContent.length}/2000
                      </span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowReplyForm(false);
                            setReplyContent('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isSubmittingReply || !replyContent.trim()}
                          className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                        >
                          {isSubmittingReply ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Replying...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Send className="h-3 w-3" />
                              Reply
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-3">
              {comment.replies.map((reply) => (
                <CommentCard
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  currentUserId={currentUserId}
                  onCommentDeleted={onCommentDeleted}
                  onReplyAdded={onReplyAdded}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
