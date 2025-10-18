'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Shield, Gamepad2, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface UserModalProps {
  user?: {
    id: number;
    username: string;
    email: string | null;
    role: string;
    minecraftUsername: string | null;
    bio?: string | null;
  } | null;
  onClose: () => void;
}

export function UserModal({ user, onClose }: UserModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [minecraftUuid, setMinecraftUuid] = useState<string | null>(null);
  const [uuidFetchStatus, setUuidFetchStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    minecraftUsername: '',
    bio: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email || '',
        password: '',
        confirmPassword: '',
        role: user.role,
        minecraftUsername: user.minecraftUsername || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  // Fetch Minecraft UUID when username changes (with debouncing)
  useEffect(() => {
    const mcUsername = formData.minecraftUsername.trim();
    
    if (!mcUsername) {
      setMinecraftUuid(null);
      setUuidFetchStatus('idle');
      return;
    }

    setUuidFetchStatus('loading');
    
    // Debounce the API call
    const timeoutId = setTimeout(async () => {
      try {
        // Use our server-side API to avoid CORS issues
        const response = await fetch(`/api/minecraft/uuid?username=${encodeURIComponent(mcUsername)}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          console.log(`UUID API returned ${response.status} for username: ${mcUsername}`);
          
          // 404 means player doesn't exist
          if (response.status === 404) {
            console.log(`Player "${mcUsername}" not found in Mojang database`);
          }
          
          setMinecraftUuid(null);
          setUuidFetchStatus('error');
          return;
        }

        const data = await response.json();
        console.log('UUID API response:', data);
        
        if (data.exists && data.uuid) {
          setMinecraftUuid(data.uuid);
          setUuidFetchStatus('success');
          console.log(`✅ Found UUID for ${mcUsername}: ${data.uuid}`);
        } else {
          setMinecraftUuid(null);
          setUuidFetchStatus('error');
        }
      } catch (error) {
        console.error('Error fetching Minecraft UUID:', error);
        setMinecraftUuid(null);
        setUuidFetchStatus('error');
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.minecraftUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      toast.error('Username is required');
      return;
    }

    if (!user && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const url = user 
        ? `/api/admin/users/${user.id}`
        : '/api/admin/users/create';
      
      const method = user ? 'PATCH' : 'POST';

      const body: any = {
        username: formData.username.trim(),
        email: formData.email.trim() || null,
        role: formData.role,
        minecraftUsername: formData.minecraftUsername.trim() || null,
        bio: formData.bio.trim() || null,
      };

      if (formData.password) {
        body.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save user');
      }

      toast.success(user ? 'User updated successfully' : 'User created successfully');
      router.refresh();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass border border-green-500/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            <span className="gradient-text">{user ? 'Edit' : 'Create'}</span> User
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <User className="h-4 w-4 inline mr-2" />
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Enter username"
              required
              minLength={3}
              maxLength={20}
              className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Mail className="h-4 w-4 inline mr-2" />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email (optional)"
              className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Lock className="h-4 w-4 inline mr-2" />
              Password {!user && '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={user ? 'Leave blank to keep current password' : 'Enter password'}
              required={!user}
              minLength={6}
              className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
            />
          </div>

          {/* Confirm Password */}
          {formData.password && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Lock className="h-4 w-4 inline mr-2" />
                Confirm Password *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm password"
                required
                className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
              />
            </div>
          )}

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Shield className="h-4 w-4 inline mr-2" />
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
            >
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Minecraft Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Gamepad2 className="h-4 w-4 inline mr-2" />
              Minecraft Username
            </label>
            <input
              type="text"
              value={formData.minecraftUsername}
              onChange={(e) => setFormData({ ...formData, minecraftUsername: e.target.value })}
              placeholder="Enter Minecraft username (optional)"
              className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
            />
          </div>

          {/* Minecraft UUID (Read-only) */}
          {formData.minecraftUsername && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Shield className="h-4 w-4 inline mr-2" />
                Minecraft UUID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={minecraftUuid || ''}
                  readOnly
                  placeholder={
                    uuidFetchStatus === 'loading' 
                      ? 'Fetching UUID...' 
                      : uuidFetchStatus === 'error' 
                      ? 'Player not found' 
                      : 'UUID will appear here'
                  }
                  className={`w-full px-4 py-3 pr-10 bg-slate-900/30 border rounded-lg text-white placeholder-gray-500 cursor-not-allowed transition-all ${
                    uuidFetchStatus === 'success' 
                      ? 'border-green-500/40 bg-green-500/5' 
                      : uuidFetchStatus === 'error'
                      ? 'border-red-500/40 bg-red-500/5'
                      : 'border-gray-500/20'
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {uuidFetchStatus === 'loading' && (
                    <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                  )}
                  {uuidFetchStatus === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  )}
                  {uuidFetchStatus === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>
              </div>
              {uuidFetchStatus === 'success' && minecraftUuid && (
                <p className="text-xs text-green-400 mt-1">
                  ✓ UUID will be automatically saved
                </p>
              )}
              {uuidFetchStatus === 'error' && (
                <p className="text-xs text-orange-400 mt-1">
                  ⚠ Player not found on Mojang servers. You can still save without UUID.
                </p>
              )}
            </div>
          )}

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FileText className="h-4 w-4 inline mr-2" />
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Enter bio (optional)"
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all resize-none"
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {formData.bio.length} / 500
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover-lift glow-green disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : user ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
