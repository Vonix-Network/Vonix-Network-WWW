'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CommentCard } from './comment-card';
import { MessageCircle, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface Comment {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  parent_comment_id: number | null;
  likes_count: number;
  author_id: number;
  author_username: string;
  author_avatar: string | null;
  author_role: string;
  replies?: Comment[];
}

interface CommentsSectionProps {
  postId: number;
  initialCommentsCount: number;
  onCommentsCountChange?: (count: number) => void;
}

export function CommentsSection({ 
  postId, 
  initialCommentsCount,
  onCommentsCountChange 
}: CommentsSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);

  const loadComments = async () => {
    if (!showComments) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/social/posts/${postId}/comments?sort=${sortBy}`);
      if (!response.ok) throw new Error('Failed to load comments');
      
      const data = await response.json();
      setComments(data.comments);
      setCommentsCount(data.total);
      
      if (onCommentsCountChange) {
        onCommentsCountChange(data.total);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [showComments, sortBy]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    if (!session) {
      toast.error('Please log in to comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/social/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post comment');
      }

      const data = await response.json();
      setNewComment('');
      
      // Add new comment to the list
      const newCommentWithReplies = { ...data.comment, replies: [] };
      setComments(prev => [newCommentWithReplies, ...prev]);
      setCommentsCount(prev => prev + 1);
      
      if (onCommentsCountChange) {
        onCommentsCountChange(commentsCount + 1);
      }
      
      toast.success('Comment posted!');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentDeleted = (commentId: number) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    setCommentsCount(prev => prev - 1);
    
    if (onCommentsCountChange) {
      onCommentsCountChange(commentsCount - 1);
    }
  };

  const handleReplyAdded = (parentId: number, reply: any) => {
    // Transform the reply back to snake_case format
    const transformedReply: Comment = {
      id: reply.id,
      content: reply.content,
      created_at: reply.createdAt,
      updated_at: reply.updatedAt,
      parent_comment_id: reply.parentCommentId,
      likes_count: reply.likesCount,
      author_id: reply.userId,
      author_username: reply.author.username,
      author_avatar: reply.author.avatar,
      author_role: reply.author.role,
    };
    
    setComments(prev => prev.map(comment => 
      comment.id === parentId 
        ? { ...comment, replies: [...(comment.replies || []), transformedReply] }
        : comment
    ));
    setCommentsCount(prev => prev + 1);
    
    if (onCommentsCountChange) {
      onCommentsCountChange(commentsCount + 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Comments Toggle */}
      <Button
        variant="ghost"
        onClick={() => setShowComments(!showComments)}
        className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors p-0"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="text-sm font-medium">{commentsCount}</span>
        {showComments ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {/* Comments Section */}
      {showComments && (
        <div className="space-y-4">
          <Separator className="border-green-500/10" />
          
          {/* Comment Form */}
          {session ? (
            <Card className="glass border-green-500/20">
              <CardContent className="p-4">
                <form onSubmit={handleSubmitComment} className="space-y-3">
                  <div className="flex gap-3">
                    <Avatar 
                      username={session.user?.minecraftUsername || session.user?.name || 'User'}
                      avatar={session.user?.avatar}
                      size="sm"
                    />
                    <div className="flex-1">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="min-h-[80px] resize-none bg-black/20 border-green-500/20 focus:border-green-500/40"
                        maxLength={2000}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {newComment.length}/2000
                        </span>
                        <Button
                          type="submit"
                          disabled={isSubmitting || !newComment.trim()}
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                        >
                          {isSubmitting ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Posting...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Send className="h-3 w-3" />
                              Comment
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">
                Please log in to leave a comment
              </p>
            </div>
          )}

          {/* Sort Options */}
          {comments.length > 0 && (
            <div className="flex gap-2">
              <span className="text-sm text-gray-400">Sort by:</span>
              {(['newest', 'oldest', 'popular'] as const).map((option) => (
                <Button
                  key={option}
                  variant={sortBy === option ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy(option)}
                  className={sortBy === option ? 'bg-green-500/20 text-green-400' : 'text-gray-400'}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Button>
              ))}
            </div>
          )}

          {/* Comments List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={{
                    id: comment.id,
                    content: comment.content,
                    createdAt: comment.created_at,
                    updatedAt: comment.updated_at,
                    parentCommentId: comment.parent_comment_id,
                    likesCount: comment.likes_count,
                    userId: comment.author_id,
                    author: {
                      id: comment.author_id,
                      username: comment.author_username,
                      minecraftUsername: comment.author_username,
                      avatar: comment.author_avatar || undefined,
                      role: comment.author_role,
                    },
                    replies: comment.replies?.map(reply => ({
                      id: reply.id,
                      content: reply.content,
                      createdAt: reply.created_at,
                      updatedAt: reply.updated_at,
                      parentCommentId: reply.parent_comment_id,
                      likesCount: reply.likes_count,
                      userId: reply.author_id,
                      author: {
                        id: reply.author_id,
                        username: reply.author_username,
                        minecraftUsername: reply.author_username,
                        avatar: reply.author_avatar || undefined,
                        role: reply.author_role,
                      },
                    }))
                  }}
                  postId={postId}
                  currentUserId={session?.user?.id ? parseInt(session.user.id) : undefined}
                  onCommentDeleted={handleCommentDeleted}
                  onReplyAdded={handleReplyAdded}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">No comments yet</p>
              <p className="text-gray-500 text-sm">Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
