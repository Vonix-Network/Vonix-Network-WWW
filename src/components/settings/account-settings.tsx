'use client';

import { Shield, Mail, User as UserIcon, Save, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface User {
  id: number;
  username: string;
  email: string | null;
  minecraftUsername: string | null;
  role: string;
}

interface AccountSettingsProps {
  user: User;
}

export function AccountSettings({ user }: AccountSettingsProps) {
  const [email, setEmail] = useState(user.email || '');
  const [saving, setSaving] = useState(false);

  async function onSaveEmail(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error('Email cannot be empty');
      return;
    }
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!isValid) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/user/change-email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update email');
      }
      toast.success('Email updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update email');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass border border-green-500/20 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-green-400" />
        Account Information
      </h2>

      <div className="space-y-4">
        {/* Username */}
        <div className="glass border border-green-500/10 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <UserIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-400">Username</span>
          </div>
          <p className="text-white font-semibold">{user.username}</p>
          <p className="text-xs text-gray-500 mt-1">Cannot be changed</p>
        </div>

        {/* Minecraft Username */}
        <div className="glass border border-green-500/10 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <UserIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-400">Minecraft Username</span>
          </div>
          <p className="text-white font-semibold">{user.minecraftUsername || 'Not set'}</p>
          <p className="text-xs text-gray-500 mt-1">Linked during registration</p>
        </div>

        {/* Email */}
        <div className="glass border border-green-500/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-400">Email</span>
            </div>
          </div>
          <form onSubmit={onSaveEmail} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">We'll use this for notifications and account recovery.</p>
        </div>

        {/* Role */}
        <div className="glass border border-green-500/10 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-400">Role</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
              user.role === 'moderator' ? 'bg-purple-500/20 text-purple-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
