'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Upload, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';

interface User {
  id: number;
  username: string;
  email: string | null;
  minecraftUsername: string | null;
  avatar: string | null;
  bio: string | null;
}

interface ProfileSettingsProps {
  user: User;
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    bio: user.bio || '',
    avatarUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: formData.bio.trim() || null,
          avatar: formData.avatarUrl.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      toast.success('Profile updated successfully');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="glass border border-green-500/20 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <User className="h-5 w-5 text-green-400" />
        Profile Settings
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Avatar</label>
          <div className="flex items-center gap-6">
            <Avatar
              username={user.username}
              minecraftUsername={user.minecraftUsername}
              avatar={formData.avatarUrl || user.avatar}
              size="xl"
            />
            <div className="flex-1">
              <div className="glass border border-green-500/10 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">
                  Default: Minecraft head from <span className="text-green-400 font-mono">mc-heads.net</span>
                </p>
                <p className="text-xs text-gray-500">
                  Minecraft Username: <span className="text-white font-mono">{user.minecraftUsername || 'Not set'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Avatar URL */}
        <div className="space-y-2">
          <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-300">
            Custom Avatar URL (Optional)
          </label>
          <input
            id="avatarUrl"
            type="url"
            value={formData.avatarUrl}
            onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
            placeholder="https://example.com/avatar.png"
            disabled={isUpdating}
            className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
          />
          <p className="text-xs text-gray-500">
            Leave empty to use your Minecraft head. Or provide a direct URL to an image.
          </p>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-300">
            Bio
          </label>
          <textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell us about yourself..."
            rows={4}
            maxLength={500}
            disabled={isUpdating}
            className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all resize-none"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Max 500 characters</span>
            <span>{formData.bio.length} / 500</span>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isUpdating}
          className="group relative bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-bold overflow-hidden hover-lift glow-green disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isUpdating ? 'Saving...' : 'Save Changes'}
            {!isUpdating && <Save className="h-5 w-5" />}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </form>
    </div>
  );
}
