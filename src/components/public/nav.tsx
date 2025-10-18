'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, Server, MessageSquare, Home, User, LogIn, UserPlus, Trophy, Award, Heart } from 'lucide-react';

interface PublicNavProps {
  user?: {
    id: string;
    username: string;
    role: string;
  } | null;
}

export function PublicNav({ user }: PublicNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/servers', label: 'Servers', icon: Server },
    { href: '/forum', label: 'Forum', icon: MessageSquare },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/ranks', label: 'Ranks', icon: Award },
    { href: '/donations', label: 'Donate', icon: Heart },
  ];

  return (
    <header className="glass border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <img
                src="/static/images/logo-rm-bg.png"
                alt="Vonix Network"
                className="h-8 w-8 group-hover:scale-110 transition-transform"
              />
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            {/* Main Nav Items */}
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors relative group ${
                      isActive ? 'text-cyan-400' : 'text-gray-300 hover:text-cyan-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-blue-400 transition-all duration-300 ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`} />
                  </Link>
                );
              })}
            </div>

            {/* User Menu */}
            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white rounded-lg font-medium hover-lift glow-gradient"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
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
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
