'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { formatTimeAgo } from '@/lib/date-utils';
import { Search, Users } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';

interface Conversation {
  userId: number;
  username: string | null;
  avatar: string | null;
  minecraftUsername?: string | null;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}

interface MessagesListProps {
  conversations: Conversation[];
  selectedUserId: number | null;
  currentUserId: number;
}

export function MessagesList({ conversations, selectedUserId, currentUserId }: MessagesListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((conv) =>
    (conv.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="glass border border-green-500/20 rounded-2xl p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search conversations..."
          className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 text-sm"
        />
      </div>

      {/* Conversations */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => (
            <Link
              key={conv.userId}
              href={`/messages?thread=${conv.userId}`}
              className={`block p-3 rounded-lg transition-all hover-lift ${
                selectedUserId === conv.userId
                  ? 'bg-green-500/20 border border-green-500/40'
                  : 'bg-slate-900/30 border border-green-500/10 hover:border-green-500/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar
                    username={conv.username || 'Unknown'}
                    minecraftUsername={conv.minecraftUsername}
                    avatar={conv.avatar}
                    size="md"
                  />
                  {conv.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white truncate">{conv.username || 'Unknown User'}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatTimeAgo(conv.lastMessageTime)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">{conv.lastMessage}</p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
