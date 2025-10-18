'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Calendar, 
  MessageSquare, 
  Users, 
  Trophy,
  Shield,
  Clock,
  Heart,
  Reply,
  ChevronLeft,
  ChevronRight,
  Settings,
  Loader2,
  ArrowLeft,
  Home,
  Crown
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatTimeAgo } from '@/lib/date-utils';

interface ProfilePageProps {
  params: { username: string };
}

interface UserProfile {
  id: number;
  username: string;
  minecraftUsername?: string;
  avatar?: string;
  role: string;
  bio?: string;
  donationRankId?: string;
  rankExpiresAt?: number;
  totalDonated?: number;
  createdAt: number;
  updatedAt?: number;
}

interface DonationRank {
  id: string;
  name: string;
  color: string;
  textColor: string;
  badge?: string;
}

interface UserStats {
  socialPostsCount: number;
  socialCommentsCount: number;
  forumPostsCount: number;
  forumRepliesCount: number;
}

interface SocialPost {
  id: number;
  content: string;
  imageUrl?: string;
  createdAt: number;
  likesCount: number;
  commentsCount: number;
}

interface ForumPost {
  id: number;
  title: string;
  content: string;
  createdAt: number;
  views: number;
  category: {
    name: string;
    slug: string;
  };
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { data: session } = useSession();
  const username = decodeURIComponent(params.username);
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [userRank, setUserRank] = useState<DonationRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'social' | 'forum'>('social');
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [username]);

  useEffect(() => {
    if (user) {
      fetchContent();
    }
  }, [user, activeTab, currentPage, itemsPerPage]);

  const fetchUserProfile = async () => {
    try {
      // Add cache busting to prevent stale data
      const timestamp = Date.now();
      const response = await fetch(`/api/users/${username}?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) {
        throw new Error('User not found');
      }
      const data = await response.json();
      setUser(data.user);
      
      // Fetch stats with cache busting
      const statsResponse = await fetch(`/api/users/${username}/stats?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      // Fetch donation rank if user has one
      if (data.user.donationRankId) {
        const rankResponse = await fetch(`/api/admin/donor-ranks`);
        if (rankResponse.ok) {
          const ranks = await rankResponse.json();
          const rank = ranks.find((r: DonationRank) => r.id === data.user.donationRankId);
          if (rank) setUserRank(rank);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContent = async () => {
    if (!user) return;
    
    setContentLoading(true);
    try {
      const response = await fetch(
        `/api/users/${username}/${activeTab}?page=${currentPage}&limit=${itemsPerPage}`
      );
      if (response.ok) {
        const data = await response.json();
        if (activeTab === 'social') {
          setSocialPosts(data.posts);
        } else {
          setForumPosts(data.posts);
        }
        setTotalItems(data.total);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setContentLoading(false);
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const isOwnProfile = session?.user?.id === user?.id.toString();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">User Not Found</h1>
          <p className="text-gray-400">The user you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-green-950/20 to-slate-950 animate-gradient-xy" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Navigation Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">User Profile</h1>
                <p className="text-gray-400 text-sm">View {user.username}'s profile and activity</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="outline" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/social">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Social
                </Button>
              </Link>
              <Link href="/forum">
                <Button variant="ghost" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Forum
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar
                username={user.username}
                minecraftUsername={user.minecraftUsername}
                avatar={user.avatar}
                size="xl"
                className="mx-auto md:mx-0"
              />
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                  <h1 
                    className="text-3xl font-bold"
                    style={{
                      color: userRank
                        ? (userRank.textColor !== '#000000' && userRank.textColor !== '#000'
                          ? userRank.textColor
                          : '#ffffff')
                        : '#ffffff'
                    }}
                  >
                    {user.username}
                  </h1>
                  {user.role && user.role !== 'user' && (
                    <Badge variant="outline" className={`${
                      user.role === 'admin' ? 'text-red-400 border-red-400' :
                      user.role === 'moderator' ? 'text-blue-400 border-blue-400' :
                      'text-green-400 border-green-400'
                    }`}>
                      <Shield className="h-3 w-3 mr-1" />
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  )}
                  {userRank && (
                    <Badge 
                      variant="outline" 
                      className="flex items-center gap-1"
                      style={{
                        backgroundColor: userRank.color + '20',
                        color: (userRank.textColor !== '#000000' && userRank.textColor !== '#000') ? userRank.textColor : '#ffffff',
                        borderColor: userRank.color + '60',
                      }}
                    >
                      <Crown className="h-3 w-3" />
                      {userRank.badge || userRank.name}
                    </Badge>
                  )}
                </div>
                
                {user.minecraftUsername && (
                  <p className="text-gray-400 mb-2">Minecraft: {user.minecraftUsername}</p>
                )}
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {formatTimeAgo(user.createdAt)}
                  </div>
                  {user.updatedAt && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Last active {formatTimeAgo(user.updatedAt)}
                    </div>
                  )}
                </div>

                {user.bio && (
                  <p className="text-gray-300 max-w-2xl">{user.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Activity Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Activity Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span className="text-sm">Social Posts</span>
                  </div>
                  <span className="font-semibold text-white">{stats?.socialPostsCount || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Reply className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Comments</span>
                  </div>
                  <span className="font-semibold text-white">{stats?.socialCommentsCount || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-400" />
                    <span className="text-sm">Forum Posts</span>
                  </div>
                  <span className="font-semibold text-white">{stats?.forumPostsCount || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-orange-400" />
                    <span className="text-sm">Forum Replies</span>
                  </div>
                  <span className="font-semibold text-white">{stats?.forumRepliesCount || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {session && !isOwnProfile && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link
                    href={`/messages/new?to=${user.username}`}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Send Message
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Content Navigation */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant={activeTab === 'social' ? 'default' : 'ghost'}
                      onClick={() => {
                        setActiveTab('social');
                        setCurrentPage(1);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Social Posts
                    </Button>
                    <Button
                      variant={activeTab === 'forum' ? 'default' : 'ghost'}
                      onClick={() => {
                        setActiveTab('forum');
                        setCurrentPage(1);
                      }}
                      className="flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Forum Posts
                    </Button>
                  </div>
                  
                  {/* Items per page selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Show:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(parseInt(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                    >
                      {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {contentLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-green-400" />
                  </div>
                ) : (
                  <>
                    {/* Social Posts */}
                    {activeTab === 'social' && (
                      <div className="space-y-4">
                        {socialPosts.length > 0 ? (
                          socialPosts.map((post) => (
                            <div key={post.id} className="p-4 glass border border-green-500/20 rounded-lg">
                              <p className="text-gray-300 mb-3 line-clamp-3">{post.content}</p>
                              {post.imageUrl && (
                                <img
                                  src={post.imageUrl}
                                  alt="Post image"
                                  className="max-w-xs rounded-lg mb-3"
                                />
                              )}
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Heart className="h-4 w-4" />
                                  {post.likesCount}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-4 w-4" />
                                  {post.commentsCount}
                                </span>
                                <span>{formatTimeAgo(post.createdAt)}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12">
                            <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">No Social Posts</h3>
                            <p className="text-gray-400">
                              {isOwnProfile 
                                ? "You haven't created any social posts yet."
                                : `${user.username} hasn't created any social posts yet.`
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Forum Posts */}
                    {activeTab === 'forum' && (
                      <div className="space-y-4">
                        {forumPosts.length > 0 ? (
                          forumPosts.map((post) => (
                            <Link
                              key={post.id}
                              href={`/forum/${post.category.slug}/${post.id}`}
                              className="block p-4 glass border border-green-500/20 rounded-lg hover:bg-white/5 transition-colors"
                            >
                              <h3 className="font-semibold text-white mb-2">{post.title}</h3>
                              <p className="text-gray-400 text-sm mb-3 line-clamp-2">{post.content}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>in {post.category.name}</span>
                                <span>{post.views} views</span>
                                <span>{formatTimeAgo(post.createdAt)}</span>
                              </div>
                            </Link>
                          ))
                        ) : (
                          <div className="text-center py-12">
                            <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">No Forum Posts</h3>
                            <p className="text-gray-400">
                              {isOwnProfile 
                                ? "You haven't created any forum posts yet."
                                : `${user.username} hasn't created any forum posts yet.`
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-700">
                        <div className="text-sm text-gray-400">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          
                          <span className="text-sm text-gray-400">
                            Page {currentPage} of {totalPages}
                          </span>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
