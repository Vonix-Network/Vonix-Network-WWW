'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';

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
  } | null;
}

interface MessageThreadProps {
  messages: Message[];
  threadUser: {
    id: number;
    username: string;
    avatar: string | null;
    minecraftUsername?: string | null;
  };
  currentUserId: number;
}

export function MessageThread({ messages, threadUser, currentUserId }: MessageThreadProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Please write a message');
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: threadUser.id,
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setContent('');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="glass border border-blue-500/20 rounded-2xl overflow-hidden flex flex-col h-[600px]">
      {/* Thread Header */}
      <div className="p-4 border-b border-blue-500/10 bg-slate-900/30">
        <div className="flex items-center gap-3">
          <Avatar
            username={threadUser.username}
            minecraftUsername={threadUser.minecraftUsername}
            avatar={threadUser.avatar}
            size="md"
          />
          <div>
            <div className="font-semibold text-white">{threadUser.username}</div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.senderId === currentUserId;
          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  isOwn
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-slate-900/50 border border-blue-500/20 text-gray-300'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                <div
                  className={`text-xs mt-1 ${
                    isOwn ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {formatDistanceToNow(new Date(message.createdAt * 1000), { addSuffix: true })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-green-500/10 bg-slate-900/30">
        <div className="flex items-end gap-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            rows={2}
            maxLength={1000}
            disabled={isSending}
            className="flex-1 px-4 py-2 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={isSending || !content.trim()}
            className="group relative bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-lg overflow-hidden hover-lift glow-green disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="h-5 w-5 relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          {content.length} / 1000 • Press Enter to send, Shift+Enter for new line
        </div>
      </form>
    </div>
  );
}
