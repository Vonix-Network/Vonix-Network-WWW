'use client';

import { Bell, Search, User } from 'lucide-react';
import Link from 'next/link';

interface AdminHeaderProps {
  user: {
    name?: string | null;
    username?: string;
    role?: string;
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="h-16 glass border-b border-white/10 flex items-center justify-between px-6">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search users, content, settings..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4 ml-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-cyan-400 hover:bg-white/5 rounded-lg transition-all">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="text-right">
            <div className="text-sm font-medium text-white">
              {user.username || user.name}
            </div>
            <div className="text-xs text-gray-400 capitalize">{user.role}</div>
          </div>
          <Link
            href="/settings"
            className="p-2 glass border border-purple-500/30 rounded-lg hover:border-purple-500/50 transition-all"
          >
            <User className="h-5 w-5 text-purple-400" />
          </Link>
        </div>
      </div>
    </header>
  );
}
