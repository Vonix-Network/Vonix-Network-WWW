'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Crown, Users, RefreshCw, Edit2, Trash2, Search, Check } from 'lucide-react';
import { EditUserRankModal } from '@/components/admin/edit-user-rank-modal';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { WebSocketStatus } from '@/components/WebSocketStatus';

export interface Rank {
  id: string;
  name: string;
  minAmount: number;
  color: string;
  textColor: string;
  duration: number;
  badge?: string;
  userCount?: number;
}

export interface UserWithRank {
  id: number;
  username: string;
  minecraftUsername?: string | null;
  totalDonated: number;
  donationRankId: string | null;
  rankExpiresAt: number | null;
  xp?: number;
  level?: number;
  title?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserRanksClientProps {
  initialRanks: Rank[];
}

export function UserRanksClient({ initialRanks }: UserRanksClientProps) {
  const [users, setUsers] = useState<UserWithRank[]>([]);
  const [ranks, setRanks] = useState<Rank[]>(initialRanks);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<UserWithRank | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { lastMessage, isConnected } = useWebSocket();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const usersRes = await fetch('/api/admin/users/with-ranks', { cache: 'no-store' });

      if (!usersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const { users: usersData } = await usersRes.json();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (lastMessage?.type === 'RANK_CREATED' || lastMessage?.type === 'RANK_UPDATED' || lastMessage?.type === 'RANK_DELETED') {
      fetchData();
    }
  }, [lastMessage, fetchData]);

  const handleForceRefresh = async () => {
    setIsSaving(true);
    await fetchData();
    setIsSaving(false);
    toast.success('Data refreshed successfully');
  };

  const calculateRemainingDays = (expiresAt: number | null): string => {
    if (!expiresAt) return 'Never';
    const now = new Date();
    const expireDate = new Date(expiresAt);
    const diffTime = expireDate.getTime() - now.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days` : 'Expired';
  };

  const formatExpirationDate = (expiresAt: number | null): string => {
    if (!expiresAt) return 'Never';
    return new Date(expiresAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSaveRank = async (userId: number, data: {
    rankId: string;
    totalDonated: number;
    expiresInDays: number;
  }) => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/admin/users/${userId}/donation-rank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update rank');
      }

      await fetchData();
      setEditingUser(null);
      toast.success('Rank updated successfully');
    } catch (error) {
      console.error('Error updating rank:', error);
      toast.error('Failed to update rank');
    } finally {
      setIsSaving(false);
    }
  };

  const removeRank = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this rank?')) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/admin/users/${userId}/donation-rank`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove rank');
      }

      await fetchData();
      toast.success('Rank removed successfully');
    } catch (error) {
      console.error('Error removing rank:', error);
      toast.error('Failed to remove rank');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.minecraftUsername?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const usersWithRanks = filteredUsers.filter(u => u.donationRankId);
  const usersWithoutRanks = filteredUsers.filter(u => !u.donationRankId);

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass border border-cyan-500/20 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Users className="h-7 w-7 text-cyan-400" />
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">User Rank Assignments</span>
            </h2>
            <p className="text-gray-400 mt-1">Assign and manage user donation ranks</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <WebSocketStatus />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="pl-10 pr-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={handleForceRefresh}
              disabled={isSaving}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 min-w-[120px]"
            >
              <RefreshCw className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
              {isSaving ? 'Updating...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Users with Ranks */}
      <div className="glass border border-cyan-500/20 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-400" />
            Users with Ranks
            <span className="text-sm text-gray-400">({usersWithRanks.length})</span>
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-slate-900/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rank</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Donated</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Expires</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {usersWithRanks.length > 0 ? (
                usersWithRanks.map((user) => {
                  const rank = ranks.find(r => r.id === user.donationRankId);
                  const remainingDays = calculateRemainingDays(user.rankExpiresAt);
                  
                  return (
                    <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-lg overflow-hidden bg-slate-700 flex items-center justify-center pixelated">
                            {user.minecraftUsername ? (
                              <img
                                src={`https://mc-heads.net/head/${user.minecraftUsername}/40`}
                                alt={user.username}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-slate-600 flex items-center justify-center text-white">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{user.username}</div>
                            {user.minecraftUsername && (
                              <div className="text-xs text-gray-400">{user.minecraftUsername}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {rank ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="h-4 w-4 rounded-full"
                              style={{ backgroundColor: rank.color }}
                            />
                            <span className="text-sm font-medium" style={{ color: rank.textColor }}>
                              {rank.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No rank</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        ${user.totalDonated?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {formatExpirationDate(user.rankExpiresAt)}
                        </div>
                        <div className={`text-xs ${remainingDays === 'Expired' ? 'text-red-400' : 'text-cyan-400'}`}>
                          {remainingDays}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-cyan-400 hover:text-cyan-300 p-2 rounded-lg hover:bg-cyan-500/10 transition-colors"
                            title="Edit rank"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeRank(user.id)}
                            className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                            title="Remove rank"
                            disabled={isSaving}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Crown className="h-12 w-12 text-yellow-400/30" />
                      <p className="text-gray-400 text-lg">No users with ranks found</p>
                      <p className="text-sm text-gray-500">Assign ranks to users to see them here</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users without Ranks */}
      <div className="glass border border-purple-500/20 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-400" />
            Users without Ranks
            <span className="text-sm text-gray-400">({usersWithoutRanks.length})</span>
          </h3>
        </div>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-slate-900/50 sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {usersWithoutRanks.length > 0 ? (
                usersWithoutRanks.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-lg overflow-hidden bg-slate-700 flex items-center justify-center pixelated">
                          {user.minecraftUsername ? (
                            <img
                              src={`https://mc-heads.net/head/${user.minecraftUsername}/40`}
                              alt={user.username}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-slate-600 flex items-center justify-center text-white">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{user.username}</div>
                          {user.minecraftUsername && (
                            <div className="text-xs text-gray-400">{user.minecraftUsername}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        No Rank
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 hover:from-cyan-500/30 hover:to-purple-500/30 transition-colors border border-cyan-500/20"
                        disabled={isSaving}
                      >
                        Assign Rank
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Check className="h-12 w-12 text-green-400/30" />
                      <p className="text-gray-400 text-lg">All users have ranks assigned</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Rank Modal */}
      {editingUser && (
        <EditUserRankModal
          user={{
            id: editingUser.id,
            username: editingUser.username,
            email: null,
            password: '',
            role: 'user' as const,
            minecraftUsername: editingUser.minecraftUsername || null,
            minecraftUuid: null,
            avatar: null,
            bio: null,
            preferredBackground: null,
            squareCustomerId: null,
            stripeCustomerId: null,
            donorRank: null,
            donationRankId: editingUser.donationRankId,
            rankExpiresAt: editingUser.rankExpiresAt ? new Date(editingUser.rankExpiresAt) : null,
            rankPaused: false,
            pausedRankId: null,
            pausedRemainingDays: null,
            pausedAt: null,
            totalDonated: editingUser.totalDonated,
            xp: editingUser.xp || 0,
            level: editingUser.level || 1,
            title: editingUser.title || null,
            createdAt: new Date(editingUser.createdAt),
            updatedAt: new Date(editingUser.updatedAt),
          }}
          ranks={ranks}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveRank}
        />
      )}
    </div>
  );
}
