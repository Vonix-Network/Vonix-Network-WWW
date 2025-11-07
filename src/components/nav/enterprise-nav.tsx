'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Home, Users, MessageSquare, Mail, Settings, LogOut, Shield, Search, Menu, X,
  Trophy, Server, Award, Heart, User, LogIn, UserPlus, ChevronDown, UserCircle,
  Gamepad2, Newspaper, Calendar, Gift, CreditCard, BookOpen, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/notification-bell';

const getUserAvatar = (minecraftUsername?: string | null, avatar?: string | null, size = 64) =>
  minecraftUsername
    ? `https://mc-heads.net/head/${minecraftUsername}/${size}`
    : avatar || `https://mc-heads.net/head/steve/${size}`;

interface NavItem {
  href?: string;
  label: string;
  icon: any;
  dropdown?: NavItem[];
  badge?: string | number;
  description?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface EnterpriseNavProps {
  user?: {
    id?: string;
    name?: string | null;
    username?: string;
    minecraftUsername?: string | null;
    avatar?: string | null;
    role?: string;
  } | null;
}

export function EnterpriseNav({ user }: EnterpriseNavProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const userMenuRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isModerator = user?.role === 'admin' || user?.role === 'moderator' || user?.role === 'superadmin';

  // Navigation configuration - centralized and organized
  const getNavigation = (): NavSection[] => {
    if (user) {
      // Authenticated user navigation
      return [
        {
          title: 'Main',
          items: [
            { href: '/dashboard', label: 'Dashboard', icon: Home },
          ]
        },
        {
          title: 'Community',
          items: [
            { href: '/social', label: 'Social', icon: Users, description: 'Posts & feed' },
            { href: '/forum', label: 'Forum', icon: MessageSquare, description: 'Discussions' },
            { href: '/groups', label: 'Groups', icon: Users, description: 'Community groups' },
            { href: '/events', label: 'Events', icon: Calendar, description: 'Upcoming events' },
            { href: '/messages', label: 'Messages', icon: Mail, description: 'Direct messages' },
          ]
        },
        {
          title: 'Gaming',
          items: [
            { href: '/servers', label: 'Servers', icon: Server, description: 'Game servers' },
            { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, description: 'Top players' },
          ]
        },
        {
          title: 'Donations',
          items: [
            { href: '/donations', label: 'Donate', icon: Heart, description: 'Make a donation' },
            { href: '/settings/billing', label: 'Billing & Subscriptions', icon: CreditCard, description: 'Manage payments' },
            { href: '/ranks', label: 'Ranks', icon: Award, description: 'View all ranks' },
          ]
        }
      ];
    } else {
      // Public navigation
      return [
        {
          title: 'Main',
          items: [
            { href: '/', label: 'Home', icon: Home },
          ]
        },
        {
          title: 'Community',
          items: [
            { href: '/forum', label: 'Forum', icon: MessageSquare, description: 'Discussions' },
            { href: '/social', label: 'Social', icon: Users, description: 'Community feed' },
            { href: '/events', label: 'Events', icon: Calendar, description: 'Upcoming events' },
          ]
        },
        {
          title: 'Gaming',
          items: [
            { href: '/servers', label: 'Servers', icon: Server, description: 'Play now' },
            { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, description: 'Top players' },
          ]
        },
        {
          title: 'Donations',
          items: [
            { href: '/donations', label: 'Donate', icon: Heart, description: 'Support the server' },
            { href: '/ranks', label: 'Ranks', icon: Award, description: 'Donation tiers' },
            { href: '/blog', label: 'Blog', icon: Newspaper, description: 'News & updates' },
          ]
        }
      ];
    }
  };

  const navigation = getNavigation();

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      
      const isOutsideDropdowns = Object.values(dropdownRefs.current).every(
        ref => !ref || !ref.contains(target)
      );
      
      if (isOutsideDropdowns) {
        setOpenDropdown(null);
      }

      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
    setIsUserMenuOpen(false);
  }, [pathname]);

  const isActiveSection = (section: NavSection): boolean => {
    return section.items.some(item => item.href === pathname);
  };

  // Hover intent helpers to avoid immediate close when moving into panel
  const openMenu = (title: string) => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDropdown(title);
  };

  const scheduleCloseMenu = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      setOpenDropdown(null);
      closeTimeoutRef.current = null;
    }, 180); // small delay to allow cursor to enter panel
  };

  return (
    <>
      {/* Main Navigation Bar */}
      <nav className="glass border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl bg-black/30">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-3 group">
              <div className="relative">
                <img
                  src="/static/images/logo-rm-bg.png"
                  alt="Vonix Network"
                  className="h-10 w-10 group-hover:scale-110 transition-transform duration-200"
                />
              </div>
              <span className="text-xl font-bold gradient-text hidden sm:inline">
                Vonix Network
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navigation.map((section) => {
                const isActive = isActiveSection(section);
                const hasMultipleItems = section.items.length > 1;
                
                if (!hasMultipleItems) {
                  // Single item - direct link
                  const item = section.items[0];
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href!}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        pathname === item.href
                          ? "text-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20"
                          : "text-gray-300 hover:text-cyan-400 hover:bg-white/5"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                }

                // Multiple items - dropdown menu
                return (
                  <div
                    key={section.title}
                    className="relative"
                    onMouseEnter={() => openMenu(section.title)}
                    onMouseLeave={scheduleCloseMenu}
                    ref={(el) => {dropdownRefs.current[section.title] = el}}
                  >
                    <button
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive
                          ? "text-cyan-400 bg-cyan-500/10"
                          : "text-gray-300 hover:text-cyan-400 hover:bg-white/5"
                      )}
                    >
                      <span>{section.title}</span>
                      <ChevronDown className={cn(
                        "h-3 w-3 transition-transform duration-200",
                        openDropdown === section.title && "rotate-180"
                      )} />
                    </button>
                    
                    {openDropdown === section.title && (
                      <div
                        className="absolute left-0 top-full mt-2 w-72 z-50"
                        onMouseEnter={() => openMenu(section.title)}
                        onMouseLeave={scheduleCloseMenu}
                      >
                        <div className="bg-gray-900/95 backdrop-blur-xl border border-cyan-500/20 rounded-xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
                          <div className="p-2">
                            {section.items.map((item) => {
                              const Icon = item.icon;
                              return (
                                <Link
                                  key={item.href}
                                  href={item.href!}
                                  className={cn(
                                    "flex items-start gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                                    pathname === item.href
                                      ? "text-cyan-400 bg-cyan-500/10 shadow-md shadow-cyan-500/10"
                                      : "text-gray-300 hover:text-cyan-400 hover:bg-white/5"
                                  )}
                                >
                                  <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium">{item.label}</div>
                                    {item.description && (
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {item.description}
                                      </div>
                                    )}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* Search (Desktop) */}
                  <Link
                    href="/search"
                    className="hidden md:flex items-center justify-center h-9 w-9 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-white/5 transition-all"
                  >
                    <Search className="h-4 w-4" />
                  </Link>

                  {/* Notifications */}
                  <div className="hidden md:block">
                    <NotificationBell />
                  </div>

                  {/* User Menu */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 transition-all group"
                    >
                      <img
                        src={getUserAvatar(user.minecraftUsername, user.avatar, 32)}
                        alt={user.username || user.name || 'User'}
                        className="h-8 w-8 rounded-lg pixelated border border-cyan-500/40 group-hover:border-cyan-500/60 transition-colors"
                      />
                      <span className="hidden xl:inline text-sm font-medium text-gray-300 group-hover:text-cyan-400 max-w-[120px] truncate">
                        {user.username || user.name}
                      </span>
                      <ChevronDown className={cn(
                        "h-3 w-3 text-gray-400 group-hover:text-cyan-400 transition-all duration-200 hidden xl:inline",
                        isUserMenuOpen && "rotate-180"
                      )} />
                    </button>
                    
                    {isUserMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900/95 backdrop-blur-xl border border-cyan-500/20 rounded-xl shadow-2xl shadow-cyan-500/10 z-50 overflow-hidden">
                        <div className="p-2">
                          <Link
                            href={`/profile/${user.username || user.id}`}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:text-cyan-400 hover:bg-white/5 transition-all"
                          >
                            <UserCircle className="h-4 w-4" />
                            View Profile
                          </Link>
                          <Link
                            href="/settings"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:text-cyan-400 hover:bg-white/5 transition-all"
                          >
                            <Settings className="h-4 w-4" />
                            Settings
                          </Link>
                          <Link
                            href="/settings/billing"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:text-cyan-400 hover:bg-white/5 transition-all"
                          >
                            <CreditCard className="h-4 w-4" />
                            Billing
                          </Link>
                        </div>
                        
                        {/* Admin/Moderation Section */}
                        {(isModerator || isAdmin) && (
                          <>
                            <div className="border-t border-white/10">
                              <div className="p-2">
                                <div className="px-4 py-1.5">
                                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Management
                                  </h3>
                                </div>
                                {isModerator && (
                                  <Link
                                    href="/moderation"
                                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-cyan-400 hover:bg-cyan-500/10 transition-all"
                                  >
                                    <Shield className="h-4 w-4" />
                                    Moderation
                                  </Link>
                                )}
                                {isAdmin && (
                                  <Link
                                    href="/admin"
                                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-purple-400 hover:bg-purple-500/10 transition-all"
                                  >
                                    <Shield className="h-4 w-4" />
                                    Admin Dashboard
                                  </Link>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                        
                        <div className="border-t border-white/10">
                          <div className="p-2">
                            <button
                              onClick={() => signOut({ callbackUrl: '/', redirect: true })}
                              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all w-full text-left"
                            >
                              <LogOut className="h-4 w-4" />
                              Logout
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 hover:text-cyan-400 hover:bg-white/5 rounded-lg transition-all"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Login</span>
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-200"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign Up</span>
                  </Link>
                </>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-400 hover:text-cyan-400 transition-colors rounded-lg hover:bg-white/5"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-40 bg-gray-900/98 backdrop-blur-xl overflow-y-auto">
          <div className="max-w-md mx-auto px-4 py-6">
            {user && (
              <>
                {/* User Profile Card */}
                <div className="px-4 py-4 glass rounded-xl border border-cyan-500/20 shadow-lg shadow-cyan-500/10 mb-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={getUserAvatar(user.minecraftUsername, user.avatar, 48)}
                      alt={user.username || user.name || 'User'}
                      className="h-12 w-12 rounded-lg pixelated border-2 border-cyan-500/50"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-cyan-400 truncate">
                        {user.username || user.name}
                      </p>
                      <p className="text-sm text-gray-400 capitalize">
                        {user.role || 'Member'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <Link
                    href={`/profile/${user.username || user.id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/20 transition-all"
                  >
                    <UserCircle className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-medium text-gray-300">Profile</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/20 transition-all"
                  >
                    <Settings className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-medium text-gray-300">Settings</span>
                  </Link>
                </div>
              </>
            )}

            {/* Navigation Sections */}
            <div className="space-y-6">
              {navigation.map((section) => (
                <div key={section.title}>
                  <div className="px-2 mb-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {section.title}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href!}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all",
                            pathname === item.href
                              ? "text-cyan-400 bg-cyan-500/10 shadow-md shadow-cyan-500/10 border border-cyan-500/20"
                              : "text-gray-300 hover:text-cyan-400 hover:bg-white/5"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <div className="flex-1">
                            <div>{item.label}</div>
                            {item.description && (
                              <div className="text-xs text-gray-500">{item.description}</div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Management Section (Moderator/Admin) */}
              {user && (isModerator || isAdmin) && (
                <div>
                  <div className="px-2 mb-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Management
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {isModerator && (
                      <Link
                        href="/moderation"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                      >
                        <Shield className="h-5 w-5" />
                        Moderation
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all"
                      >
                        <Shield className="h-5 w-5" />
                        Admin Dashboard
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Logout */}
              {user && (
                <div className="pt-4 border-t border-white/10">
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
                </div>
              )}

              {/* Login/Register for Guests */}
              {!user && (
                <div className="pt-4 border-t border-white/10 space-y-3">
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
                    className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium shadow-lg shadow-cyan-500/30"
                  >
                    <UserPlus className="h-5 w-5" />
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
