'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input'; // Using regular input for now
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: number;
  username: string;
  email?: string;
  role: string;
  minecraftUsername?: string;
  createdAt: number;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [usernameToDelete, setUsernameToDelete] = useState('');

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchUsers();
    }
  }, [session]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/cleanup-user', {
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}" and ALL their data? This cannot be undone!`)) {
      return;
    }

    try {
      setDeleteLoading(username);
      const response = await fetch('/api/admin/cleanup-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        toast.success(`User ${username} deleted successfully`);
        await fetchUsers(); // Refresh the list
        setUsernameToDelete('');
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

  const clearBrowserCache = () => {
    // Clear browser cache
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Force reload
    window.location.reload();
    toast.success('Browser cache cleared and page reloaded');
  };

  if (session?.user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
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
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-2">Manage users and fix profile page issues</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={clearBrowserCache} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
          <Button onClick={fetchUsers} disabled={loading}>
            <Users className="h-4 w-4 mr-2" />
            Refresh Users
          </Button>
        </div>
      </div>

      {/* Quick Delete Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-400">⚠️ Danger Zone</CardTitle>
          <CardDescription>
            Completely delete a user and all their data. Use this to fix profile page issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter username to delete"
              value={usernameToDelete}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsernameToDelete(e.target.value)}
              className="max-w-xs px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <Button
              onClick={() => handleDeleteUser(usernameToDelete)}
              disabled={!usernameToDelete || deleteLoading === usernameToDelete}
              variant="destructive"
            >
              {deleteLoading === usernameToDelete ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete User
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            This will delete the user and all their posts, comments, and forum activity.
          </p>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
          <CardDescription>
            Current users in the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-green-400" />
              <p className="text-gray-400">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 glass border border-green-500/20 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {user.minecraftUsername ? (
                      <img
                        src={`https://mc-heads.net/head/${user.minecraftUsername}/64`}
                        alt={user.minecraftUsername}
                        className="w-12 h-12 rounded-lg border-2 border-green-500/30"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=10b981&color=fff&size=64`;
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center text-2xl font-bold text-green-400 border-2 border-green-500/30">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-white">{user.username}</h3>
                      <p className="text-sm text-gray-400">
                        {user.minecraftUsername && <span className="text-green-400">{user.minecraftUsername} • </span>}
                        ID: {user.id} • {user.email || 'No email'} • 
                        Created: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                      {user.role}
                    </Badge>
                    <Button
                      onClick={() => handleDeleteUser(user.username)}
                      disabled={deleteLoading === user.username}
                      variant="destructive"
                      size="sm"
                    >
                      {deleteLoading === user.username ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
