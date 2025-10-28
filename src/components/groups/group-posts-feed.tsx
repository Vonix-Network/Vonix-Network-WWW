'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Image as ImageIcon, Send, MoreVertical, Pin, Trash2, MessageCircle, Heart, Edit, X, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { ReportButton } from '@/components/shared/report-button';
import { GroupPostComments } from './group-post-comments';

interface GroupPost {
  id: number;
  content: string;
  imageUrl: string | null;
  likesCount: number;
  commentsCount: number;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    username: string;
    minecraftUsername: string | null;
    avatar: string | null;
    role: string;
    level: number;
    donationRankId: string | null;
  };
}

interface DonationRank {
  id: string;
  name: string;
  color: string;
  textColor: string;
  badge: string | null;
  glow: boolean;
}

interface GroupPostsFeedProps {
  groupId: number;
  userRole: 'admin' | 'moderator' | 'member' | null;
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

export function GroupPostsFeed({ groupId, userRole }: GroupPostsFeedProps) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [editingPost, setEditingPost] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editImage, setEditImage] = useState('');
  const [donationRanks, setDonationRanks] = useState<Map<string, DonationRank>>(new Map());
  
  // Create post state
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Action menu state
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  // Fetch donation ranks
  useEffect(() => {
    fetch('/api/donor-ranks')
      .then(res => res.json())
      .then((ranks: DonationRank[]) => {
        const rankMap = new Map<string, DonationRank>(ranks.map(r => [r.id, r]));
        setDonationRanks(rankMap);
      })
      .catch(console.error);
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/posts?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      
      const data = await response.json();
      setPosts(data.posts);
      setTotalPages(data.pagination.totalPages);
      setHasMore(data.pagination.hasMore);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, limit]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newPostContent,
          imageUrl: newPostImage || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to create post');

      toast.success('Post created successfully');
      setNewPostContent('');
      setNewPostImage('');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/groups/${groupId}/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete post');

      toast.success('Post deleted');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const handleTogglePin = async (postId: number, currentPinned: boolean) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !currentPinned }),
      });

      if (!response.ok) throw new Error('Failed to update post');

      toast.success(currentPinned ? 'Post unpinned' : 'Post pinned');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to update post');
    }
  };

  const canModerate = userRole === 'admin' || userRole === 'moderator' || session?.user?.role === 'admin' || session?.user?.role === 'moderator';

  const handleLike = async (postId: number) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/posts/${postId}/like`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to like post');

      const data = await response.json();
      
      // Update liked state
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (data.liked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });

      // Update likes count
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likesCount: data.likesCount }
          : post
      ));
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleEdit = (post: GroupPost) => {
    setEditingPost(post.id);
    setEditContent(post.content);
    setEditImage(post.imageUrl || '');
  };

  const handleSaveEdit = async (postId: number) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editContent,
          imageUrl: editImage || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to update post');

      toast.success('Post updated');
      setEditingPost(null);
      fetchPosts();
    } catch (error) {
      toast.error('Failed to update post');
    }
  };

  const validLimits = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200];

  return (
    <div className="space-y-6">
      {/* Create Post */}
      {userRole && (
        <form onSubmit={handleCreatePost} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="flex gap-4">
            <img
              src={getUserAvatar(session?.user?.minecraftUsername, session?.user?.avatar, 48)}
              alt="Your avatar"
              className="w-12 h-12 rounded-lg pixelated"
            />
            <div className="flex-1 space-y-3">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={3}
                maxLength={5000}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              />
              <div className="flex items-center gap-3">
                <input
                  type="url"
                  value={newPostImage}
                  onChange={(e) => setNewPostImage(e.target.value)}
                  placeholder="Image URL (optional)"
                  className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  type="submit"
                  disabled={!newPostContent.trim() || isCreating}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isCreating ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Posts Feed */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No posts yet. Be the first to post!</div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isAuthor = session?.user?.id ? Number(session.user.id) === post.author.id : false;
            const canDelete = isAuthor || canModerate;
            const canPin = canModerate;

            return (
              <div key={post.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 relative">
                {post.pinned && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full flex items-center gap-1">
                      <Pin className="w-3 h-3" />
                      Pinned
                    </span>
                  </div>
                )}

                <div className="flex gap-4">
                  <img
                    src={getUserAvatar(post.author.minecraftUsername, post.author.avatar, 48)}
                    alt={post.author.username}
                    className="w-12 h-12 rounded-lg pixelated"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span 
                        className="font-bold"
                        style={{
                          color: post.author.donationRankId && donationRanks.has(post.author.donationRankId)
                            ? (donationRanks.get(post.author.donationRankId)!.textColor !== '#000000' && donationRanks.get(post.author.donationRankId)!.textColor !== '#000'
                              ? donationRanks.get(post.author.donationRankId)!.textColor
                              : '#ffffff')
                            : '#ffffff'
                        }}
                      >
                        {post.author.username}
                      </span>
                      {post.author.donationRankId && donationRanks.has(post.author.donationRankId) && (
                        <span 
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold"
                          style={{
                            backgroundColor: donationRanks.get(post.author.donationRankId)!.color + '20',
                            color: (donationRanks.get(post.author.donationRankId)!.textColor !== '#000000' && donationRanks.get(post.author.donationRankId)!.textColor !== '#000') ? donationRanks.get(post.author.donationRankId)!.textColor : '#ffffff',
                            borderColor: donationRanks.get(post.author.donationRankId)!.color + '60',
                            border: '1px solid'
                          }}
                        >
                          <Crown className="w-3 h-3" />
                          {donationRanks.get(post.author.donationRankId)!.badge || donationRanks.get(post.author.donationRankId)!.name}
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {editingPost === post.id ? (
                      <div className="mb-3 space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          maxLength={5000}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                        />
                        <input
                          type="url"
                          value={editImage}
                          onChange={(e) => setEditImage(e.target.value)}
                          placeholder="Image URL (optional)"
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingPost(null)}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(post.id)}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-300 whitespace-pre-wrap break-words mb-3">{post.content}</p>
                    )}
                    
                    {editingPost !== post.id && post.imageUrl && (
                      <img
                        src={post.imageUrl}
                        alt="Post image"
                        className="rounded-lg max-w-full max-h-96 object-cover mb-3"
                      />
                    )}

                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-2 transition-colors ${
                          likedPosts.has(post.id) 
                            ? 'text-red-400' 
                            : 'hover:text-red-400'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                        {post.likesCount}
                      </button>
                      <button 
                        onClick={() => setExpandedComments(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(post.id)) {
                            newSet.delete(post.id);
                          } else {
                            newSet.add(post.id);
                          }
                          return newSet;
                        })}
                        className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {post.commentsCount}
                      </button>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === post.id ? null : post.id)}
                      className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-slate-400" />
                    </button>

                    {activeMenu === post.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setActiveMenu(null)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-2">
                          {isAuthor && (
                            <button
                              onClick={() => {
                                handleEdit(post);
                                setActiveMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-blue-400 hover:bg-slate-700 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Post
                            </button>
                          )}
                          {canPin && (
                            <button
                              onClick={() => {
                                handleTogglePin(post.id, post.pinned);
                                setActiveMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-yellow-400 hover:bg-slate-700 flex items-center gap-2"
                            >
                              <Pin className="w-4 h-4" />
                              {post.pinned ? 'Unpin Post' : 'Pin Post'}
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => {
                                handleDeletePost(post.id);
                                setActiveMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Post
                            </button>
                          )}
                          {!isAuthor && (
                            <div className="px-4 py-2">
                              <ReportButton
                                contentType="group_post"
                                contentId={post.id}
                                className="w-full justify-start p-0 text-left"
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Comments Section */}
                  {expandedComments.has(post.id) && (
                    <GroupPostComments
                      groupId={groupId}
                      postId={post.id}
                      userRole={userRole}
                      onCommentAdded={() => {
                        // Update comment count
                        setPosts(prev => prev.map(p => 
                          p.id === post.id 
                            ? { ...p, commentsCount: p.commentsCount + 1 }
                            : p
                        ));
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && posts.length > 0 && (
        <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Posts per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {validLimits.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
