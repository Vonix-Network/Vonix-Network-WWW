'use client';

import { useState } from 'react';
import { Trash2, RefreshCw, AlertTriangle, Database, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function QuickActions() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const performAction = async (action: string, confirmMessage: string) => {
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsLoading(true);
    setActiveAction(action);

    try {
      const response = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to perform action');
      }

      toast.success(data.message);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to perform action');
    } finally {
      setIsLoading(false);
      setActiveAction(null);
    }
  };

  const actions = [
    {
      id: 'delete_invalid_timestamps',
      label: 'Delete Invalid Timestamps',
      description: 'Remove posts with null or invalid creation dates',
      icon: Trash2,
      color: 'red',
      confirmMessage: 'This will permanently delete all posts with invalid timestamps. Continue?',
    },
    {
      id: 'fix_timestamps',
      label: 'Fix Null Timestamps',
      description: 'Set current time for posts with null timestamps',
      icon: RefreshCw,
      color: 'blue',
      confirmMessage: 'This will update all null timestamps to the current time. Continue?',
    },
    {
      id: 'delete_orphaned_replies',
      label: 'Delete Orphaned Replies',
      description: 'Remove forum replies without parent posts',
      icon: AlertTriangle,
      color: 'yellow',
      confirmMessage: 'This will delete all orphaned forum replies. Continue?',
    },
    {
      id: 'delete_orphaned_messages',
      label: 'Delete Orphaned Messages',
      description: 'Remove messages from deleted users',
      icon: Database,
      color: 'purple',
      confirmMessage: 'This will delete all messages from deleted users. Continue?',
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20';
      case 'blue':
        return 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20';
      case 'yellow':
        return 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border-yellow-500/20';
      case 'purple':
        return 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 border-gray-500/20';
    }
  };

  return (
    <div className="glass border border-blue-500/20 rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6">
        <span className="gradient-text">Quick Actions</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          const isActive = activeAction === action.id;
          
          return (
            <button
              key={action.id}
              onClick={() => performAction(action.id, action.confirmMessage)}
              disabled={isLoading}
              className={`
                p-4 rounded-lg border transition-all text-left
                ${getColorClasses(action.color)}
                ${isLoading && !isActive ? 'opacity-50 cursor-not-allowed' : ''}
                ${isActive ? 'ring-2 ring-blue-500/50' : ''}
              `}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {isActive ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold mb-1">{action.label}</div>
                  <div className="text-sm opacity-80">{action.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-200">
            <strong>Warning:</strong> These actions are irreversible. Always backup your database before performing cleanup operations.
          </div>
        </div>
      </div>
    </div>
  );
}
