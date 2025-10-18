'use client';

import Link from 'next/link';
import { Key, Users, Shield, Database, Settings, BarChart3, Award, DollarSign, Crown } from 'lucide-react';

export function AdminNavigation() {
  const navItems = [
    {
      title: 'API Keys',
      description: 'Manage registration API keys',
      href: '/admin/api-keys',
      icon: Key,
      color: 'green',
    },
    {
      title: 'User Management',
      description: 'View and manage users',
      href: '/admin/users',
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Donor Ranks',
      description: 'Manage donation ranks',
      href: '/admin/donor-ranks',
      icon: Award,
      color: 'yellow',
    },
    {
      title: 'User Ranks',
      description: 'Assign ranks to users',
      href: '/admin/user-ranks',
      icon: Crown,
      color: 'cyan',
    },
    {
      title: 'Donations',
      description: 'Manage donation records',
      href: '/admin/donations',
      icon: DollarSign,
      color: 'green',
    },
    {
      title: 'Moderation',
      description: 'Forum and social moderation',
      href: '/moderation',
      icon: Shield,
      color: 'red',
    },
    {
      title: 'Database',
      description: 'Database maintenance tools',
      href: '/admin#quick-actions',
      icon: Database,
      color: 'purple',
    },
    {
      title: 'Settings',
      description: 'System configuration',
      href: '/admin/settings',
      icon: Settings,
      color: 'gray',
    },
    {
      title: 'Analytics',
      description: 'View system statistics',
      href: '/admin#stats',
      icon: BarChart3,
      color: 'cyan',
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20';
      case 'blue':
        return 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20';
      case 'red':
        return 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20';
      case 'purple':
        return 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border-purple-500/20';
      case 'yellow':
        return 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border-yellow-500/20';
      case 'cyan':
        return 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border-cyan-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 border-gray-500/20';
    }
  };

  return (
    <div className="glass border border-blue-500/20 rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6">
        <span className="gradient-text">Admin Tools</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                p-4 rounded-lg border transition-all text-left block
                ${getColorClasses(item.color)}
                hover:scale-105 hover:shadow-lg
              `}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold mb-1">{item.title}</div>
                  <div className="text-sm opacity-80">{item.description}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
