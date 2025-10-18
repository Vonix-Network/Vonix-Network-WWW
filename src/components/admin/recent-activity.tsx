'use client';

import { Activity, FileText, MessageSquare, Users, Heart, Reply } from 'lucide-react';
import { formatTimeAgo } from '@/lib/date-utils';

interface ActivityItem {
  type: string;
  text: string;
  time: Date | number;
  username?: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return { icon: Users, color: 'text-blue-400' };
      case 'social_post':
        return { icon: FileText, color: 'text-green-400' };
      case 'forum_post':
        return { icon: MessageSquare, color: 'text-purple-400' };
      case 'forum_reply':
        return { icon: Reply, color: 'text-cyan-400' };
      case 'social_like':
        return { icon: Heart, color: 'text-pink-400' };
      default:
        return { icon: Activity, color: 'text-gray-400' };
    }
  };

  return (
    <div className="glass border border-white/10 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-green-400" />
        Recent Activity
      </h2>

      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No recent activity
          </div>
        ) : (
          activities.map((activity, index) => {
            const { icon: Icon, color } = getActivityIcon(activity.type);
            return (
              <div key={index} className="flex items-start gap-3 p-3 glass border border-white/10 rounded-lg">
                <div className={`p-2 rounded-lg bg-white/5 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">{activity.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.time)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 text-center">
        <button className="text-sm text-gray-400 hover:text-green-400 transition-colors">
          View All Activity →
        </button>
      </div>
    </div>
  );
}

export function AdminStats() {
  return null; // Placeholder for future use
}
