'use client';

import { useState } from 'react';
import { MessagesList } from './messages-list';
import { MessageThread } from './message-thread';
import { LiveChat } from '@/components/chat/LiveChat';
import { Mail, Inbox, MessageCircle } from 'lucide-react';

interface Conversation {
  userId: number;
  username: string;
  avatar: string | null;
  minecraftUsername: string | null;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  recipientId: number;
  read: boolean;
  createdAt: number;
  sender: {
    username: string;
    avatar: string | null;
  };
}

interface ThreadUser {
  id: number;
  username: string;
  avatar: string | null;
  minecraftUsername: string | null;
}

interface MessagesPageClientProps {
  conversations: Conversation[];
  selectedThreadUserId: number | null;
  threadMessages: Message[] | null;
  threadUser: ThreadUser | null;
  currentUserId: number;
}

export function MessagesPageClient({
  conversations,
  selectedThreadUserId,
  threadMessages,
  threadUser,
  currentUserId,
}: MessagesPageClientProps) {
  const [activeTab, setActiveTab] = useState<'private' | 'community'>('private');

  return (
    <>
      {/* Header with Tabs */}
      <div className="glass border border-green-500/20 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="gradient-text">Messages</span>
            </h1>
            <p className="text-gray-400">Private conversations and community chat</p>
          </div>
          <div className="flex items-center gap-4">
            <Mail className="h-8 w-8 text-green-400 float" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('private')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'private'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>Private Messages</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'community'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span>Community Chat</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'private' ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <MessagesList
              conversations={conversations}
              selectedUserId={selectedThreadUserId}
              currentUserId={currentUserId}
            />
          </div>

          {/* Message Thread */}
          <div className="lg:col-span-2">
            {selectedThreadUserId && threadUser && threadMessages ? (
              <MessageThread
                messages={threadMessages}
                threadUser={threadUser}
                currentUserId={currentUserId}
              />
            ) : (
              <div className="glass border border-green-500/20 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center">
                <Inbox className="h-16 w-16 text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">Select a conversation to view messages</p>
                <p className="text-gray-500 text-sm mt-2">or start a new chat from a user's profile</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass border border-green-500/20 rounded-2xl p-6">
          {/* Pinned Info */}
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <MessageCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-400 mb-1">Community Discord Chat</h3>
                <p className="text-sm text-gray-300">
                  This chat is synced with our Discord server. Messages you send here will appear in Discord and vice versa.
                  Join the conversation with the entire community!
                </p>
              </div>
            </div>
          </div>

          {/* Live Chat */}
          <LiveChat readOnly={false} showInput={true} messageLimit={50} />
        </div>
      )}
    </>
  );
}
