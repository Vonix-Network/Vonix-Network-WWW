/**
 * Enterprise Admin Sidebar
 * Professional navigation with icons and active states
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Crown,
  Server,
  MessageSquare,
  FileText,
  Flag,
  BarChart3,
  Key,
  Settings,
  ChevronLeft,
  Menu,
  Sparkles,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Donations', href: '/admin/donations', icon: DollarSign },
  { label: 'Donor Ranks', href: '/admin/donor-ranks', icon: Crown },
  { label: 'User Ranks', href: '/admin/user-ranks', icon: Crown },
  { label: 'XP Rewards', href: '/admin/xp-rewards', icon: Sparkles },
  { label: 'Servers', href: '/admin/servers', icon: Server },
  { label: 'Discord', href: '/admin/discord', icon: MessageSquare },
  { label: 'Blog', href: '/admin/blog', icon: FileText },
  { label: 'Reports', href: '/admin/reports', icon: Flag },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'API Keys', href: '/admin/api-keys', icon: Key },
  { label: 'Registration Codes', href: '/admin/registration-codes', icon: Key },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen bg-black/40 backdrop-blur-xl border-r border-white/10 transition-all duration-300 z-40',
          'flex flex-col',
          isCollapsed ? 'w-20' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          {!isCollapsed && (
            <Link href="/admin" className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg gradient-text">Admin</span>
            </Link>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className={cn('h-5 w-5 transition-transform', isCollapsed && 'rotate-180')} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                  isActive
                    ? 'bg-primary/10 text-primary shadow-glow-purple'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                )}

                <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} />
                
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}

                {!isCollapsed && item.badge && (
                  <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/20 text-primary">
                    {item.badge}
                  </span>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
              'text-muted-foreground hover:text-foreground hover:bg-white/5'
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            {!isCollapsed && <span className="font-medium">Back to Dashboard</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
