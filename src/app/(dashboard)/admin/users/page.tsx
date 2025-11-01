'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UserPlus,
  Shield,
  Crown,
  X,
  Check,
  AlertTriangle,
  BarChart3,
  MessageSquare,
  FileText,
  Key
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface User {
  id: number;
  username: string;
  email: string | null;
  minecraftUsername: string | null;
  avatar: string | null;
  role: 'user' | 'moderator' | 'admin';
  level: number;
  xp: number;
  createdAt: Date;
  updatedAt: Date;
  stats: {
    socialPosts: number;
    forumPosts: number;
    forumReplies: number;
  };
}

interface EditUserData {
  username?: string;
  email?: string;
  minecraftUsername?: string;
  role?: 'user' | 'moderator' | 'admin';
}

export default function EnterpriseUserManagement() {
  const { data: session } = useSession();
  
  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // UI state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditUserData>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

  // Fetch users
  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchUsers();
    }
  }, [session, page, limit, search, roleFilter, sortBy, sortOrder]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email || '',
      minecraftUsername: user.minecraftUsername || '',
      role: user.role,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        toast.success('User updated successfully');
        setIsEditModalOpen(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This cannot be undone!`)) {
      return;
    }

    try {
      setDeleteLoading(userId);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(`User ${username} deleted successfully`);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handlePasswordReset = async () => {
    if (!passwordResetUser || !newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setPasswordResetLoading(true);
      const response = await fetch(`/api/admin/users/${passwordResetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      if (response.ok) {
        toast.success(`Password reset for ${passwordResetUser.username}`);
        setPasswordResetUser(null);
        setNewPassword('');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const toggleUserSelection = (userId: number) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'moderator': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-3 w-3" />;
      case 'moderator': return <Crown className="h-3 w-3" />;
      default: return null;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (session?.user?.role !== 'admin') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
              <p className="text-gray-400">You need admin privileges to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-cyan-400" />
            User Management
          </h1>
          <p className="text-gray-400 mt-2">
            Manage all platform users • {total.toLocaleString()} total users
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={fetchUsers} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Total Users</span>
              <Users className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-white">{total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Admins</span>
              <Shield className="h-4 w-4 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {users.filter(u => u.role === 'admin').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Moderators</span>
              <Crown className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {users.filter(u => u.role === 'moderator').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Regular Users</span>
              <Users className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {users.filter(u => u.role === 'user').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by username, email, or Minecraft username..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Roles</option>
              <option value="user">Users</option>
              <option value="moderator">Moderators</option>
              <option value="admin">Admins</option>
            </select>

            {/* Per Page */}
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value));
                setPage(1);
              }}
              className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
              <option value="200">200 per page</option>
            </select>

            {/* Selected Actions */}
            {selectedUsers.size > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-400">
                  {selectedUsers.size} selected
                </span>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUsers(new Set())}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Users List</span>
            <Badge variant="outline">
              Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} of {total}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
              <p className="text-gray-400">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50 border-b border-white/10">
                  <tr>
                    <th className="p-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === users.length && users.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded"
                      />
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-300">User</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-300">Contact</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-300">Role</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-300">Level & XP</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-300">Activity</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-300">Joined</th>
                    <th className="p-4 text-right text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user) => (
                    <tr 
                      key={user.id} 
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="w-4 h-4 rounded"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {user.minecraftUsername ? (
                            <img
                              src={`https://mc-heads.net/head/${user.minecraftUsername}/64`}
                              alt={user.username}
                              className="w-10 h-10 rounded-lg pixelated border-2 border-cyan-500/30"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center text-xl font-bold text-cyan-400 border-2 border-cyan-500/30">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-white">{user.username}</p>
                            {user.minecraftUsername && (
                              <p className="text-xs text-cyan-400">{user.minecraftUsername}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-400">{user.email || 'No email'}</p>
                        <p className="text-xs text-gray-500">ID: {user.id}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                          <span className="flex items-center gap-1">
                            {getRoleIcon(user.role)}
                            {user.role}
                          </span>
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p className="text-white font-medium">Level {user.level}</p>
                          <p className="text-xs text-gray-400">{user.xp.toLocaleString()} XP</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-1 text-gray-400">
                            <MessageSquare className="h-3 w-3" />
                            {user.stats.socialPosts}
                          </span>
                          <span className="flex items-center gap-1 text-gray-400">
                            <FileText className="h-3 w-3" />
                            {user.stats.forumPosts}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-400">{formatDate(user.createdAt)}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            title="Edit user"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPasswordResetUser(user)}
                            title="Reset password"
                          >
                            <Key className="h-4 w-4 text-yellow-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            disabled={deleteLoading === user.id}
                            title="Delete user"
                          >
                            {deleteLoading === user.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-red-400" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Page {page} of {totalPages} • {total.toLocaleString()} total users
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={page === 1 || loading}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-4 py-2 bg-gray-800 rounded-lg text-sm text-white">
                  {page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages || loading}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsEditModalOpen(false)}
          />
          <Card className="relative z-10 w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-cyan-400" />
                Edit User: {editingUser.username}
              </CardTitle>
              <CardDescription>
                Update user information and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <Input
                    value={editForm.username || ''}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    placeholder="Username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <Input
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="user@example.com"
                    type="email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Minecraft Username
                  </label>
                  <Input
                    value={editForm.minecraftUsername || ''}
                    onChange={(e) => setEditForm({ ...editForm, minecraftUsername: e.target.value })}
                    placeholder="MinecraftPlayer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    value={editForm.role || 'user'}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <Button onClick={handleSaveEdit} className="flex-1">
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Password Reset Modal */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setPasswordResetUser(null);
              setNewPassword('');
            }}
          />
          <Card className="relative z-10 w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-yellow-400" />
                Reset Password: {passwordResetUser.username}
              </CardTitle>
              <CardDescription>
                Enter a new password for this user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePasswordReset();
                    }
                  }}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Password will be hashed and stored securely
                </p>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={handlePasswordReset} 
                    className="flex-1"
                    disabled={passwordResetLoading || !newPassword}
                  >
                    {passwordResetLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Reset Password
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setPasswordResetUser(null);
                      setNewPassword('');
                    }}
                    className="flex-1"
                    disabled={passwordResetLoading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
