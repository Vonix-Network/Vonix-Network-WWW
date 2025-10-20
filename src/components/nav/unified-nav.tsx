'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/notification-bell';

interface UnifiedNavProps {
  user?: {
    id?: string;
    name?: string | null;
    username?: string;
    role?: string;
  } | null;
}

export function UnifiedNav({ user }: UnifiedNavProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      <nav className="glass border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              href={user ? '/dashboard' : '/'} 
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
                        ? "text-cyan-400 bg-cyan-400/10 shadow-lg shadow-green-500/20"
                        : "text-gray-300 hover:text-cyan-400 hover:bg-white/5"
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
                      <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-cyan-400 hover:bg-white/5 transition-all">
                          <Shield className="h-4 w-4" />
                          <span className="hidden sm:inline">Moderation</span>
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 glass border border-blue-500/20 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          <Link
                            href="/moderation/forum"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-cyan-400 hover:bg-white/5 transition-colors first:rounded-t-lg"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Forum Moderation
                          </Link>
                          <Link
                            href="/moderation/social"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-cyan-400 hover:bg-white/5 transition-colors last:rounded-b-lg"
                          >
                            <Users className="h-4 w-4" />
                            Social Moderation
                          </Link>
                        </div>
                      </div>
                    )}

                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-cyan-400 hover:bg-white/5 transition-all"
                      >
                        <Shield className="h-4 w-4" />
                        <span className="hidden sm:inline">Admin</span>
                      </Link>
                    )}

                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-cyan-400 hover:bg-white/5 transition-all"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">Settings</span>
                    </Link>

                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline">Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Public user actions */}
                    <Link
                      href="/login"
                      className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-cyan-400 transition-colors"
                    >
                      <LogIn className="h-4 w-4" />
                      <span className="hidden sm:inline">Login</span>
                    </Link>
                    <Link
                      href="/register"
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white rounded-lg font-medium hover-lift glow-gradient"
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
                className="md:hidden p-2 text-gray-400 hover:text-cyan-400 transition-colors rounded-lg hover:bg-white/5"
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
                        ? "text-cyan-400 bg-cyan-400/10 shadow-lg shadow-green-500/20"
                        : "text-gray-300 hover:text-cyan-400 hover:bg-white/5"
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

                  {/* Moderation Links */}
                  {isModerator && (
                    <>
                      <Link
                        href="/moderation/forum"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-cyan-400 hover:bg-white/5 transition-all"
                      >
                        <MessageSquare className="h-5 w-5" />
                        Forum Moderation
                      </Link>
                      <Link
                        href="/moderation/social"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-cyan-400 hover:bg-white/5 transition-all"
                      >
                        <Users className="h-5 w-5" />
                        Social Moderation
                      </Link>
                    </>
                  )}

                  {/* Admin Link */}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-cyan-400 hover:bg-white/5 transition-all"
                    >
                      <Shield className="h-5 w-5" />
                      Admin
                    </Link>
                  )}

                  {/* Settings */}
                  <Link
                    href="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-cyan-400 hover:bg-white/5 transition-all"
                  >
                    <Settings className="h-5 w-5" />
                    Settings
                  </Link>

                  {/* Logout */}
                  <button
                    onClick={() => {
                      signOut();
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
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-cyan-400 hover:bg-white/5 transition-all"
                  >
                    <LogIn className="h-5 w-5" />
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white rounded-lg font-medium hover-lift glow-gradient"
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
