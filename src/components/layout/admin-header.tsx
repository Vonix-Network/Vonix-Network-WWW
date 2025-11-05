/**
 * Enterprise Admin Header
 * Top navigation with search, notifications, and user menu
 */

'use client';

import React, { useState } from 'react';
import { Search, Bell, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getUserAvatar } from '@/lib/utils';

export function AdminHeader() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="sticky top-0 z-30 bg-black/40 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Search */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users, donations, reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-80 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-scale-in">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="font-semibold">Notifications</h3>
                  </div>
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No new notifications
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 pr-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Image
                src={getUserAvatar(session?.user?.minecraftUsername, session?.user?.avatar, 32)}
                alt={session?.user?.username || 'User'}
                width={32}
                height={32}
                className="rounded-lg pixelated"
              />
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium">{session?.user?.username}</p>
                <p className="text-xs text-muted-foreground capitalize">{session?.user?.role}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-scale-in">
                  <div className="p-2 space-y-1">
                    <a
                      href="/settings"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="text-sm">Settings</span>
                    </a>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-error/10 text-error transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm">Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
