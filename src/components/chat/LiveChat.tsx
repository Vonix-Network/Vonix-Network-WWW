'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Send } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface ChatMessage {
  id: number;
  discordMessageId: string | null;
  authorName: string;
  authorAvatar: string | null;
  content: string | null;
  embeds: string | null;
  attachments: string | null;
  timestamp: Date;
}

interface LiveChatProps {
  readOnly?: boolean;
  showInput?: boolean;
  messageLimit?: number;
  disableAutoScroll?: boolean;
}

export function LiveChat({ readOnly = false, showInput = true, messageLimit = 50, disableAutoScroll = false }: LiveChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [botStatus, setBotStatus] = useState<{ configured: boolean; active: boolean } | null>(null);
  const [discordUrl, setDiscordUrl] = useState('https://discord.gg/C7xmVgQnK5');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasInitialLoadRef = useRef(false);

  useEffect(() => {
    loadMessages();
    loadBotStatus();
    loadDiscordUrl();
    
    // Set up polling for updates
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadMessages();
        loadBotStatus();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [messageLimit]);

  const loadDiscordUrl = async () => {
    try {
      const response = await fetch('/api/admin/settings/discord');
      if (response.ok) {
        const data = await response.json();
        setDiscordUrl(data.inviteUrl || 'https://discord.gg/C7xmVgQnK5');
      }
    } catch (error) {
      // Use default if fetch fails
    }
  };

  // Only auto-scroll on initial load, not on refresh (unless disabled)
  useEffect(() => {
    if (!loading && !hasInitialLoadRef.current && messages.length > 0 && !disableAutoScroll) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        scrollToBottom('auto');
        hasInitialLoadRef.current = true;
      }, 100);
    }
  }, [loading, disableAutoScroll]);

  // Don't auto-scroll on message updates after initial load
  // Users can manually scroll if they want

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/chat/messages?limit=${messageLimit}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBotStatus = async () => {
    try {
      const response = await fetch('/api/discord/status');
      if (response.ok) {
        const data = await response.json();
        setBotStatus(data);
      }
    } catch (error) {
      console.error('Error loading bot status:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || sending || !session) return;

    setSending(true);
    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageInput.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      setMessageInput('');
      // Refresh messages
      await loadMessages();
      // Scroll to bottom after sending
      setTimeout(() => scrollToBottom('smooth'), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'nearest', inline: 'nearest' });
  };

  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto h-[600px] bg-slate-900/50 border border-green-500/20 rounded-lg overflow-hidden">
      {/* Chat Header */}
      <div className="px-4 py-3 bg-slate-900/80 border-b border-green-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎮</span>
            <div>
              <h3 className="text-lg font-semibold text-white">Live Community Chat</h3>
              <p className="text-sm text-gray-400">
                {botStatus === null ? 'Checking status...' :
                 !botStatus.configured ? 'Bot not configured' :
                 !botStatus.active ? 'Bot offline' :
                 'Connected to Discord'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              botStatus === null ? 'bg-gray-500' :
              !botStatus.configured ? 'bg-red-500' :
              !botStatus.active ? 'bg-yellow-500' :
              'bg-green-500 animate-pulse'
            }`}></div>
            <span className={`text-xs ${
              botStatus === null ? 'text-gray-400' :
              !botStatus.configured ? 'text-red-400' :
              !botStatus.active ? 'text-yellow-400' :
              'text-green-400'
            }`}>
              {botStatus === null ? 'Checking...' :
               !botStatus.configured ? 'Not Setup' :
               !botStatus.active ? 'Offline' :
               'Online'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ maxHeight: 'calc(100% - 120px)' }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No messages yet. Be the first to chat!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <img
                src={message.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.authorName)}&background=6366f1&color=fff`}
                alt={message.authorName}
                className="w-10 h-10 rounded-full flex-shrink-0"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(message.authorName)}&background=6366f1&color=fff`;
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-white">{message.authorName}</span>
                  <span className="text-xs text-gray-500">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                {message.content && (
                  <p className="text-gray-300 break-words whitespace-pre-wrap">{message.content}</p>
                )}
                
                {/* Render Discord Embeds */}
                {message.embeds && (() => {
                  try {
                    const embeds = JSON.parse(message.embeds);
                    return embeds.map((embed: any, idx: number) => (
                      <div key={idx} className="mt-2 bg-slate-800/50 rounded-r-lg p-3 space-y-2 discord-animated-border">
                        {embed.author && (
                          <div className="flex items-center gap-2 text-sm">
                            {embed.author.iconURL && (
                              <img src={embed.author.iconURL} alt="" className="w-5 h-5 rounded-full" />
                            )}
                            <span className="font-semibold text-gray-200">{embed.author.name}</span>
                          </div>
                        )}
                        {embed.title && (
                          <div className="font-bold gradient-text">
                            {embed.url ? (
                              <a href={embed.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {embed.title}
                              </a>
                            ) : (
                              embed.title
                            )}
                          </div>
                        )}
                        {embed.description && (
                          <p className="text-gray-300 text-sm whitespace-pre-wrap">{embed.description}</p>
                        )}
                        {embed.fields && embed.fields.length > 0 && (
                          <div className="grid grid-cols-1 gap-2">
                            {embed.fields.map((field: any, fidx: number) => (
                              <div key={fidx}>
                                <div className="font-semibold text-gray-200 text-sm">{field.name}</div>
                                <div className="text-gray-400 text-sm">{field.value}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {embed.thumbnail && (
                          <img src={embed.thumbnail} alt="" className="max-w-[80px] rounded" />
                        )}
                        {embed.image && (
                          <img src={embed.image} alt="" className="max-w-full rounded-lg" />
                        )}
                        {embed.footer && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                            {embed.footer.iconURL && (
                              <img src={embed.footer.iconURL} alt="" className="w-4 h-4 rounded-full" />
                            )}
                            <span>{embed.footer.text}</span>
                          </div>
                        )}
                      </div>
                    ));
                  } catch {
                    return null;
                  }
                })()}
                
                {/* Render Attachments */}
                {message.attachments && (() => {
                  try {
                    const attachments = JSON.parse(message.attachments);
                    return attachments.map((att: any, idx: number) => (
                      <div key={idx} className="mt-2">
                        {att.contentType?.startsWith('image/') ? (
                          <a href={att.url} target="_blank" rel="noopener noreferrer">
                            <img 
                              src={att.url} 
                              alt={att.filename} 
                              className="max-w-full max-h-96 rounded-lg border border-green-500/20 hover:border-green-500/50 transition-colors cursor-pointer"
                            />
                          </a>
                        ) : (
                          <a 
                            href={att.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 border border-green-500/20 rounded-lg hover:border-green-500/50 transition-colors text-sm text-gray-300"
                          >
                            <span>📎</span>
                            <span>{att.filename}</span>
                            <span className="text-xs text-gray-500">({(att.size / 1024).toFixed(1)} KB)</span>
                          </a>
                        )}
                      </div>
                    ));
                  } catch {
                    return null;
                  }
                })()}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input / CTA */}
      <div className="p-4 bg-slate-900/80 border-t border-blue-500/20">
        {session && showInput && !readOnly ? (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={(session.user as any)?.minecraftUsername 
                ? `Message as ${(session.user as any).minecraftUsername}` 
                : 'Type a message...'}
              disabled={sending}
              maxLength={2000}
              className="flex-1 px-4 py-2 bg-slate-800 border border-blue-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !messageInput.trim()}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover-lift glow-gradient disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        ) : (
          <div className="text-center py-2 px-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-gray-300">
              💬 <a href="/register" className="text-blue-400 hover:text-blue-300 font-semibold">Register</a> or <a href={discordUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-semibold">join our Discord</a> to chat with the community
            </p>
          </div>
        )}
      </div>
    </div>
  );
}