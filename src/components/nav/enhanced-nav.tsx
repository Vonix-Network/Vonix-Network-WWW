'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Home, Users, MessageSquare, Mail, Settings, LogOut, Shield, Search, Menu, X,
  Trophy, Server, Award, Heart, User, LogIn, UserPlus, ChevronDown, UserCircle,
  Gamepad2, Newspaper, Calendar, TrendingUp, BookOpen, Zap, Star, Gift
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

interface NavItem {
  href?: string;
  label: string;
  icon: any;
  dropdown?: NavItem[];
  badge?: string | number;
}

interface EnhancedNavProps {
  user?: {
    id?: string;
    name?: string | null;
    username?: string;
    minecraftUsername?: string | null;
    avatar?: string | null;
    role?: string;
  } | null;
}

export function EnhancedNav({ user }: EnhancedNavProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'admin' || user?.role === 'moderator';

  // Public navigation structure
  const publicNavItems: NavItem[] = [
    { href: '/', label: 'Home', icon: Home },
    {
      label: 'Community',
      icon: Users,
      dropdown: [
        { href: '/forum', label: 'Forum', icon: MessageSquare },
        { href: '/social', label: 'Social Feed', icon: Users },
        { href: '/groups', label: 'Groups', icon: Users },
        { href: '/events', label: 'Events', icon: Calendar },
      ]
    },
    {
      label: 'Gaming',
      icon: Gamepad2,
      dropdown: [
        { href: '/servers', label: 'Servers', icon: Server },
        { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
      ]
    },
    { href: '/blog', label: 'Blog', icon: Newspaper },
    {
      href: '/donations',
      label: 'Donations',
      icon: Heart,
      dropdown: [
        { href: '/ranks', label: 'Donor Ranks', icon: Award },
      ]
    },
  ];

  // Authenticated user navigation
  const dashboardNavItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    {
      label: 'Community',
      icon: Users,
      dropdown: [
        { href: '/social', label: 'Social Feed', icon: Users },
        { href: '/groups', label: 'Groups', icon: Users },
        { href: '/forum', label: 'Forum', icon: MessageSquare },
        { href: '/events', label: 'Events', icon: Calendar },
        { href: '/messages', label: 'Messages', icon: Mail },
      ]
    },
    {
      label: 'Gaming',
      icon: Gamepad2,
      dropdown: [
        { href: '/servers', label: 'Servers', icon: Server },
        { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
      ]
    },
    {
      href: '/donations',
      label: 'Donations',
      icon: Heart,
      dropdown: [
        { href: '/ranks', label: 'Donor Ranks', icon: Award },
      ]
    },
    { href: '/search', label: 'Search', icon: Search },
  ];

  const navItems = user ? dashboardNavItems : publicNavItems;

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      
      // Check if click is outside all dropdowns
      const isOutsideDropdowns = Object.values(dropdownRefs.current).every(
        ref => !ref || !ref.contains(target)
      );
      
      if (isOutsideDropdowns) {
        setOpenDropdown(null);
      }

      // Check user menu
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu and dropdowns on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
    setIsUserMenuOpen(false);
  }, [pathname]);

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const isActiveItem = (item: NavItem): boolean => {
    if (item.href && pathname === item.href) return true;
    if (item.dropdown) {
      return item.dropdown.some(child => child.href === pathname);
    }
    return false;
  };

  return (
    <>
      <nav className="glass border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl bg-black/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <img
                  src="/static/images/logo-rm-bg.png"
                  alt="Vonix Network"
                  className="h-8 w-8 group-hover:scale-110 transition-transform"
                />
              </div>
              <span className="text-xl font-bold gradient-text hidden sm:inline">
                Vonix Network
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveItem(item);
                
                if (item.dropdown) {
                  return (
                    <div
                      key={item.label}
                      className="relative"
                      onMouseEnter={() => setOpenDropdown(item.label)}
                      onMouseLeave={() => setOpenDropdown(null)}
                      ref={(el) => {dropdownRefs.current[item.label] = el}}
                    >
                      <Link
                        href={item.href || '#'}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          isActive
                            ? "text-brand-cyan bg-brand-cyan/10 shadow-lg shadow-brand-cyan/30 border border-brand-cyan/20"
                            : "text-gray-300 hover:text-brand-cyan hover:bg-white/5"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        <ChevronDown className={cn(
                          "h-3 w-3 transition-transform",
                          openDropdown === item.label && "rotate-180"
                        )} />
                      </Link>
                      
                      {openDropdown === item.label && (
                        <div className="absolute left-0 top-full pt-2 w-56 z-50">
                          <div className="bg-gray-900 border border-brand-cyan/20 rounded-lg shadow-xl shadow-brand-cyan/10 overflow-hidden">
                          {item.dropdown.map((subItem) => {
                            const SubIcon = subItem.icon;
                            return (
                              <Link
                                key={subItem.href}
                                href={subItem.href!}
                                className={cn(
                                  "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                                  pathname === subItem.href
                                    ? "text-brand-cyan bg-brand-cyan/5 border-l-2 border-brand-cyan"
                                    : "text-gray-300 hover:text-brand-cyan hover:bg-brand-cyan/5"
                                )}
                              >
                                <SubIcon className="h-4 w-4" />
                                <span>{subItem.label}</span>
                              </Link>
                            );
                          })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "text-brand-cyan bg-brand-cyan/10 shadow-lg shadow-brand-cyan/30 border border-brand-cyan/20"
                        : "text-gray-300 hover:text-brand-cyan hover:bg-white/5"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
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
                    <NotificationBell />

                    {isModerator && (
                      <Link
                        href="/moderation"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-brand-cyan hover:bg-brand-cyan/10 transition-all"
                      >
                        <Shield className="h-4 w-4" />
                        <span className="hidden xl:inline">Moderation</span>
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-purple-400 hover:bg-purple-500/10 transition-all"
                      >
                        <Shield className="h-4 w-4" />
                        <span className="hidden xl:inline">Admin</span>
                      </Link>
                    )}

                    {/* User Menu */}
                    <div className="relative" ref={userMenuRef}>
                      <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-brand-cyan hover:bg-white/5 transition-all"
                      >
                        <img
                          src={getUserAvatar(user.minecraftUsername, user.avatar, 32)}
                          alt={user.username || user.name || 'User'}
                          className="h-8 w-8 rounded-lg pixelated border border-brand-cyan/40 shadow-sm shadow-brand-cyan/20"
                        />
                        <span className="hidden xl:inline max-w-[100px] truncate">
                          {user.username || user.name}
                        </span>
                        <ChevronDown className={cn(
                          "h-3 w-3 transition-transform hidden xl:inline",
                          isUserMenuOpen && "rotate-180"
                        )} />
                      </button>
                      
                      {isUserMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-52 bg-gray-900 border border-brand-cyan/20 rounded-lg shadow-xl shadow-brand-cyan/10 z-50 overflow-hidden">
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

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-400 hover:text-brand-cyan transition-colors rounded-lg hover:bg-white/5"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-40 bg-gray-900/95 backdrop-blur-sm overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            <div className="space-y-2">
              {user && (
                <>
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

                  <div className="border-t border-white/10 my-4" />
                </>
              )}

              {/* Mobile Navigation Items */}
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveItem(item);

                if (item.dropdown) {
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="px-4 py-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </p>
                      </div>
                      {item.dropdown.map((subItem) => {
                        const SubIcon = subItem.icon;
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href!}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ml-4",
                              pathname === subItem.href
                                ? "text-brand-cyan bg-brand-cyan/10 shadow-lg shadow-brand-cyan/30 border border-brand-cyan/20"
                                : "text-gray-300 hover:text-brand-cyan hover:bg-white/5"
                            )}
                          >
                            <SubIcon className="h-5 w-5" />
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href!}
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

              {user && (isModerator || isAdmin) && (
                <>
                  <div className="border-t border-white/10 my-4" />
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Management</p>
                  </div>
                  
                  {isModerator && (
                    <Link
                      href="/moderation"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-brand-cyan hover:bg-brand-cyan/5 transition-all"
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
                </>
              )}

              {user && (
                <>
                  <div className="border-t border-white/10 my-4" />
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
                  <div className="border-t border-white/10 my-4" />
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
