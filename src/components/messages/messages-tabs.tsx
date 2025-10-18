'use client';

import { useState } from 'react';
import { MessageCircle, Users } from 'lucide-react';
import { LiveChat } from '@/components/chat/LiveChat';

interface MessagesTabsProps {
  privateMessagesContent: React.ReactNode;
}

export function MessagesTabs({ privateMessagesContent }: MessagesTabsProps) {
  const [activeTab, setActiveTab] = useState<'private' | 'community'>('private');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-slate-900/50 border border-green-500/20 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('private')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'private'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MessageCircle className="h-5 w-5" />
          Private Messages
        </button>
        <button
          onClick={() => setActiveTab('community')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'community'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="h-5 w-5" />
          Community Chat
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'private' ? (
        privateMessagesContent
      ) : (
        <div className="glass border border-green-500/20 rounded-2xl p-6">
          <div className="h-[600px]">
            <LiveChat readOnly={false} showInput={true} messageLimit={50} />
          </div>
        </div>
      )}
    </div>
  );
}