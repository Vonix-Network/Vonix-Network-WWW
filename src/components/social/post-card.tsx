'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, MoreVertical, Trash2, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CommentsSection } from './comments-section';
import { PostModeration } from './post-moderation';
import { formatTimeAgo } from '@/lib/date-utils';

interface DonationRank {
  id: string;
  name: string;
  color: string;
  textColor: string;
  badge?: string;
}

interface PostCardProps {
  post: {
    id: number;
    content: string;
    imageUrl: string | null;
    createdAt: number | Date;
    author: {
      id: number;
      username: string;
      avatar: string | null;
      minecraftUsername?: string | null;
      role?: string | null;
      donationRankId?: string | null;
    } | null;
    likesCount: number;
    commentsCount: number;
  };
  isLiked: boolean;
  currentUserId: number;
  userRole?: 'user' | 'moderator' | 'admin';
}

export function PostCard({ post, isLiked: initialIsLiked, currentUserId, userRole = 'user' }: PostCardProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLiking, setIsLiking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [donationRank, setDonationRank] = useState<DonationRank | null>(null);

  // Fetch donation rank if user has one
  useEffect(() => {
    if (post.author?.donationRankId) {
      fetch('/api/admin/donor-ranks')
        .then(res => res.json())
        .then(ranks => {
          const rank = ranks.find((r: DonationRank) => r.id === post.author?.donationRankId);
          if (rank) setDonationRank(rank);
        })
        .catch(console.error);
    }
  }, [post.author?.donationRankId]);

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    const previousState = isLiked;
    const previousCount = likesCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

    try {
      const response = await fetch('/api/social/posts/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to like post');
      }

      router.refresh();
    } catch (error) {
      // Revert on error
      setIsLiked(previousState);
      setLikesCount(previousCount);
      toast.error('Failed to like post');
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/social/posts/${post.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      toast.success('Post deleted');
      
      // Try to refresh the posts list if we're on the social page
      if ((window as any).removeSocialPost) {
        (window as any).removeSocialPost(post.id);
      } else if ((window as any).refreshSocialPosts) {
        (window as any).refreshSocialPosts();
      } else {
        // Fallback to router refresh
        router.refresh();
      }
    } catch (error) {
      toast.error('Failed to delete post');
      setIsDeleting(false);
    }
  };

  const isOwner = post.author?.id === currentUserId;

  return (
    <div className="glass border border-blue-500/20 rounded-2xl p-6 hover-lift">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar
            username={post.author?.username || 'Unknown'}
            minecraftUsername={post.author?.minecraftUsername}
            avatar={post.author?.avatar}
            size="md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span 
                className="font-semibold"
                style={{
                  color: donationRank
                    ? (donationRank.textColor !== '#000000' && donationRank.textColor !== '#000'
                      ? donationRank.textColor
                      : '#ffffff')
                    : '#ffffff'
                }}
              >
                {post.author?.username || 'Unknown'}
              </span>
              {post.author?.role && post.author.role !== 'user' && (
                <Badge variant={post.author.role === 'admin' ? 'destructive' : 'secondary'} className="text-xs">
                  {post.author.role}
                </Badge>
              )}
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
            </div>
            <div className="text-xs text-gray-500">
              {formatTimeAgo(post.createdAt)}
            </div>
          </div>
        </div>

        <PostModeration
          postId={post.id}
          authorId={post.author?.id || 0}
          currentUserId={currentUserId}
          userRole={userRole}
        />
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-gray-300 whitespace-pre-wrap">{post.content}</p>
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt="Post image"
            className="mt-4 rounded-lg max-w-full"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 pt-4 border-t border-green-500/10">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-2 transition-all ${
            isLiked
              ? 'text-red-400 hover:text-red-300'
              : 'text-gray-400 hover:text-red-400'
          }`}
        >
          <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm font-medium">{likesCount}</span>
        </button>

        <button 
          className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{post.commentsCount}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentsSection 
          postId={post.id}
          initialCommentsCount={post.commentsCount}
        />
      )}
    </div>
  );
}
