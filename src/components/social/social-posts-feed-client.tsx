'use client';

import { useState, useEffect } from 'react';
import { PostCard } from './post-card';
import { TrendingUp } from 'lucide-react';

interface Post {
  id: number;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  author: {
    id: number;
    username: string;
    avatar: string | null;
    minecraftUsername: string | null;
    role: string;
    donationRankId: string | null;
  } | null;
  likesCount: number;
  commentsCount: number;
}

interface SocialPostsFeedClientProps {
  session: any;
  initialPosts: Post[];
}

export function SocialPostsFeedClient({ session, initialPosts }: SocialPostsFeedClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(false);

  // Function to refresh posts from server
  const refreshPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/social/posts');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Failed to refresh posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to remove a post from the list (for immediate UI update)
  const removePost = (postId: number) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  // Expose refresh function globally for deletion handlers
  useEffect(() => {
    (window as any).refreshSocialPosts = refreshPosts;
    (window as any).removeSocialPost = removePost;
    
    return () => {
      delete (window as any).refreshSocialPosts;
      delete (window as any).removeSocialPost;
    };
  }, []);

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="text-center py-4 text-gray-400">
          Refreshing posts...
        </div>
      )}
      
      {posts.length > 0 ? (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isLiked={false} // Will be updated by PostCard component
            currentUserId={parseInt(session!.user.id)}
          />
        ))
      ) : (
        <div className="glass border border-green-500/20 rounded-2xl p-12 text-center">
          <TrendingUp className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No posts yet. Be the first to share!</p>
        </div>
      )}
    </div>
  );
}
