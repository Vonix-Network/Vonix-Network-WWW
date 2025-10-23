'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Crown,
  FileText, 
  MessageSquare,
  Share2,
  Server, 
  DollarSign,
  Award,
  Settings,
  Key,
  Bot,
  BarChart3,
  Shield,
  ChevronRight,
  TrendingUp,
  Ticket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: any;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);

  const navSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      ],
    },
    {
      title: 'User Management',
      items: [
        { label: 'Users', href: '/admin/users', icon: Users },
        { label: 'User Ranks', href: '/admin/user-ranks', icon: Crown },
      ],
    },
    {
      title: 'Content',
      items: [
        { label: 'Blog', href: '/admin/blog', icon: FileText },
        { label: 'Forum', href: '/moderation/forum', icon: MessageSquare },
        { label: 'Social', href: '/moderation/social', icon: Share2 },
      ],
    },
    {
      title: 'Infrastructure',
      items: [
        { label: 'Servers', href: '/admin/servers', icon: Server },
      ],
    },
    {
      title: 'Finance',
      items: [
        { label: 'Donations', href: '/admin/donations', icon: DollarSign },
        { label: 'Donor Ranks', href: '/admin/donor-ranks', icon: Award },
      ],
    },
    {
      title: 'XP & Progression',
      items: [
        { label: 'Level Rewards', href: '/admin/xp-rewards', icon: TrendingUp },
        { label: 'Registration Codes', href: '/admin/registration-codes', icon: Ticket },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Settings', href: '/admin/settings', icon: Settings },
        { label: 'API Keys', href: '/admin/api-keys', icon: Key },
        { label: 'Discord Bot', href: '/admin/discord', icon: Bot },
        { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      ],
    },
  ];

  const toggleSection = (title: string) => {
    setCollapsedSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  return (
    <aside className="w-64 glass border-r border-white/10 flex flex-col h-screen">
      {/* Logo/Branding */}
      <div className="p-6 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Shield className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg gradient-text">Admin Panel</h1>
            <p className="text-xs text-gray-400">Vonix Network</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => {
          const isCollapsed = collapsedSections.includes(section.title);
          
          return (
            <div key={section.title}>
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.title)}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-400 transition-colors"
              >
                <span>{section.title}</span>
                <ChevronRight className={cn(
                  "h-3 w-3 transition-transform",
                  !isCollapsed && "rotate-90"
                )} />
              </button>

              {/* Section Items */}
              {!isCollapsed && (
                <div className="space-y-1 mt-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || 
                                   (item.href !== '/admin' && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                          isActive
                            ? "bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/10"
                            : "text-gray-400 hover:text-cyan-400 hover:bg-white/5"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-cyan-400 hover:bg-white/5 transition-all"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </aside>
  );
}
