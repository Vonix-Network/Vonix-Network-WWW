'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Home,
  Users,
  MessageSquare,
  Mail,
  Settings,
  LogOut,
  Shield,
  Search,
  Menu,
  X,
  Trophy,
  Server,
  Award,
  Heart,
  User,
  LogIn,
  UserPlus,
  ChevronDown,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/notification-bell';

// Helper function for Minecraft avatars
function getUserAvatar(minecraftUsername?: string | null, avatar?: string | null, size: number = 64): string {
  if (minecraftUsername) {
    return `https://mc-heads.net/head/${minecraftUsername}/${size}`;
  }
  if (avatar) {
    return avatar;
  }
  return `https://mc-heads.net/head/steve/${size}`;
}

interface UnifiedNavProps {
  user?: {
    id?: string;
    name?: string | null;
    username?: string;
    minecraftUsername?: string | null;
    avatar?: string | null;
    role?: string;
  } | null;
}

export function UnifiedNav({ user }: UnifiedNavProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModerationOpen, setIsModerationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const moderationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      try {
        if (moderationRef.current && !moderationRef.current.contains(event.target as Node)) {
          setIsModerationOpen(false);
        }
        if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
          setIsUserMenuOpen(false);
        }
      } catch (error) {
        console.error('Error in click outside handler:', error);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsModerationOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  // Public navigation items
  const publicNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/servers', label: 'Servers', icon: Server },
    { href: '/forum', label: 'Forum', icon: MessageSquare },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/ranks', label: 'Ranks', icon: Award },
    { href: '/donations', label: 'Donate', icon: Heart },
  ];

  // Dashboard navigation items (for authenticated users)
  const dashboardNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/servers', label: 'Servers', icon: Server },
    { href: '/social', label: 'Social', icon: Users },
    { href: '/groups', label: 'Groups', icon: Users },
    { href: '/forum', label: 'Forum', icon: MessageSquare },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/messages', label: 'Messages', icon: Mail },
    { href: '/search', label: 'Search', icon: Search },
  ];

  // Choose nav items based on auth status
  // Logged-in users always see dashboard nav, guests see public nav
  const navItems = user ? dashboardNavItems : publicNavItems;

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'admin' || user?.role === 'moderator';

  return (
    <>
      <nav className="glass border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl bg-black/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              href="/" 
              className="flex items-center gap-2 group"
            >
              <div className="relative">
                <img
                  src="/static/images/logo-rm-bg.png"
                  alt="Vonix Network"
                  className="h-6 w-6 group-hover:scale-110 transition-transform"
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "text-brand-cyan bg-brand-cyan/10 shadow-lg shadow-brand-cyan/30 border border-brand-cyan/20"
                        : "text-gray-300 hover:text-brand-cyan hover:bg-white/5"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Desktop Actions */}
              <div className="hidden md:flex items-center gap-2">
                {user ? (
                  <>
                    {/* Authenticated user actions */}
                    <NotificationBell />

                    {isModerator && (
                      <div className="relative" ref={moderationRef}>
                        <button
                          onClick={() => setIsModerationOpen(!isModerationOpen)}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-brand-cyan hover:bg-white/5 transition-all"
                        >
                          <Shield className="h-4 w-4" />
                          <span className="hidden sm:inline">Moderation</span>
                          <ChevronDown className={cn("h-3 w-3 transition-transform", isModerationOpen && "rotate-180")} />
                        </button>
                        {isModerationOpen && (
                          <div className="absolute right-0 top-full mt-2 w-48 glass border border-brand-cyan/20 rounded-lg shadow-xl shadow-brand-cyan/10 z-50">
                            <Link
                              href="/moderation/forum"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-brand-cyan hover:bg-brand-cyan/5 transition-colors first:rounded-t-lg"
                            >
                              <MessageSquare className="h-4 w-4" />
                              Forum Moderation
                            </Link>
                            <Link
                              href="/moderation/social"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-brand-cyan hover:bg-brand-cyan/5 transition-colors last:rounded-b-lg"
                            >
                              <Users className="h-4 w-4" />
                              Social Moderation
                            </Link>
                          </div>
                        )}
                      </div>
                    )}

                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all"
                      >
                        <Shield className="h-4 w-4" />
                        <span className="hidden sm:inline">Admin</span>
                      </Link>
                    )}

                    {/* User Menu Dropdown */}
                    <div className="relative" ref={userMenuRef}>
                      <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-brand-cyan hover:bg-white/5 transition-all"
                      >
                        <img
                          src={getUserAvatar(user.minecraftUsername, user.avatar, 32)}
                          alt={user.username || user.name || 'User'}
                          className="h-7 w-7 rounded-lg pixelated border border-brand-cyan/40 shadow-sm shadow-brand-cyan/20"
                        />
                        <span className="hidden lg:inline max-w-[100px] truncate">
                          {user.username || user.name}
                        </span>
                        <ChevronDown className={cn("h-3 w-3 transition-transform", isUserMenuOpen && "rotate-180")} />
                      </button>
                      {isUserMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-52 glass border border-brand-cyan/20 rounded-lg shadow-xl shadow-brand-cyan/10 z-50 overflow-hidden">
                          <Link
                            href={`/profile/${user.username || user.id}`}
                            className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:text-brand-cyan hover:bg-brand-cyan/5 transition-colors border-b border-white/10"
                          >
                            <UserCircle className="h-4 w-4" />
                            View Profile
                          </Link>
                          <Link
                            href="/settings"
                            className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:text-brand-cyan hover:bg-brand-cyan/5 transition-colors"
                          >
                            <Settings className="h-4 w-4" />
                            Settings
                          </Link>
                          <button
                            onClick={() => signOut({ callbackUrl: '/', redirect: true })}
                            className="flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full text-left border-t border-white/10"
                          >
                            <LogOut className="h-4 w-4" />
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Public user actions */}
                    <Link
                      href="/login"
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 hover:text-brand-cyan hover:bg-white/5 rounded-lg transition-all"
                    >
                      <LogIn className="h-4 w-4" />
                      <span className="hidden sm:inline">Login</span>
                    </Link>
                    <Link
                      href="/register"
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink text-white rounded-lg font-medium hover-lift shadow-lg shadow-brand-cyan/30 hover:shadow-brand-cyan/50 transition-all"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="hidden sm:inline">Sign Up</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Button - Always visible on mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-brand-cyan transition-colors rounded-lg hover:bg-white/5"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-gray-900/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="space-y-4">
              {/* Navigation Items */}
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200",
                      isActive
                        ? "text-brand-cyan bg-brand-cyan/10 shadow-lg shadow-brand-cyan/30 border border-brand-cyan/20"
                        : "text-gray-300 hover:text-brand-cyan hover:bg-white/5"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}

              {user && (
                <>
                  {/* Divider */}
                  <div className="border-t border-white/10 my-4" />

                  {/* User Profile Card */}
                  <div className="px-4 py-3 glass rounded-lg border border-brand-cyan/20 shadow-lg shadow-brand-cyan/10 mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={getUserAvatar(user.minecraftUsername, user.avatar, 48)}
                        alt={user.username || user.name || 'User'}
                        className="h-12 w-12 rounded-lg pixelated border-2 border-brand-cyan/50 shadow-sm shadow-brand-cyan/20"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-brand-cyan truncate">
                          {user.username || user.name}
                        </p>
                        <p className="text-xs text-gray-400 capitalize">
                          {user.role || 'Member'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/profile/${user.username || user.id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-brand-cyan hover:bg-brand-cyan/5 transition-all"
                  >
                    <UserCircle className="h-5 w-5" />
                    My Profile
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-brand-cyan hover:bg-brand-cyan/5 transition-all"
                  >
                    <Settings className="h-5 w-5" />
                    Settings
                  </Link>

                  {/* Divider for elevated roles */}
                  {(isModerator || isAdmin) && (
                    <div className="border-t border-white/10 my-4" />
                  )}

                  {/* Moderation Links */}
                  {isModerator && (
                    <>
                      <div className="px-4 py-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Moderation</p>
                      </div>
                      <Link
                        href="/moderation/forum"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-brand-cyan hover:bg-brand-cyan/5 transition-all"
                      >
                        <MessageSquare className="h-5 w-5" />
                        Forum Moderation
                      </Link>
                      <Link
                        href="/moderation/social"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-brand-cyan hover:bg-brand-cyan/5 transition-all"
                      >
                        <Users className="h-5 w-5" />
                        Social Moderation
                      </Link>
                    </>
                  )}

                  {/* Admin Link */}
                  {isAdmin && (
                    <>
                      <div className="px-4 py-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Administration</p>
                      </div>
                      <Link
                        href="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all"
                      >
                        <Shield className="h-5 w-5" />
                        Admin Dashboard
                      </Link>
                    </>
                  )}

                  {/* Divider */}
                  <div className="border-t border-white/10 my-4" />

                  {/* Logout */}
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/', redirect: true });
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all w-full text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                </>
              )}

              {!user && (
                <>
                  {/* Divider */}
                  <div className="border-t border-white/10 my-4" />

                  {/* Login/Register */}
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-brand-cyan hover:bg-brand-cyan/5 transition-all"
                  >
                    <LogIn className="h-5 w-5" />
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink text-white rounded-lg font-medium hover-lift shadow-lg shadow-brand-cyan/30"
                  >
                    <UserPlus className="h-5 w-5" />
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
