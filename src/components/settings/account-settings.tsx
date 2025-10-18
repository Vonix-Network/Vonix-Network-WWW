'use client';

import { Shield, Mail, User as UserIcon } from 'lucide-react';

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
          <div className="flex items-center gap-3 mb-2">
            <Mail className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-400">Email</span>
          </div>
          <p className="text-white font-semibold">{user.email || 'Not provided'}</p>
          <p className="text-xs text-gray-500 mt-1">Optional during registration</p>
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
