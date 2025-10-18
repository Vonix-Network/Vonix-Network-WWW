'use client';

import { useState, useEffect } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { ReplyForm } from './reply-form';
import { ReplyModeration } from './reply-moderation';
import { formatTimeAgo } from '@/lib/date-utils';
import { BBCode } from '@/lib/bbcode';
import { MessageSquare, Clock, Crown } from 'lucide-react';

interface Reply {
  id: number;
  content: string;
  createdAt: Date;
  author: {
    id: number;
    username: string;
    avatar: string | null;
    minecraftUsername: string | null;
    role: string;
    donationRankId: string | null;
  } | null;
}

interface DonationRank {
  id: string;
  name: string;
  color: string;
  textColor: string;
  badge: string | null;
}

interface ForumRepliesSectionProps {
  postId: number;
  initialReplies: Reply[];
  session: any;
  rankMap: Map<string, DonationRank>;
}

export function ForumRepliesSection({ postId, initialReplies, session, rankMap }: ForumRepliesSectionProps) {
  const [replies, setReplies] = useState<Reply[]>(initialReplies);
  const [isLoading, setIsLoading] = useState(false);

  // Function to refresh replies from server
  const refreshReplies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/forum/posts/${postId}/replies`);
      if (response.ok) {
        const data = await response.json();
        setReplies(data.replies || []);
      }
    } catch (error) {
      console.error('Failed to refresh replies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to add a new reply to the list
  const addReply = (newReply: Reply) => {
    setReplies(prevReplies => [...prevReplies, newReply]);
  };

  // Function to remove a reply from the list
  const removeReply = (replyId: number) => {
    setReplies(prevReplies => prevReplies.filter(reply => reply.id !== replyId));
  };

  // Expose refresh function globally for reply handlers
  useEffect(() => {
    (window as any).refreshForumReplies = refreshReplies;
    (window as any).addForumReply = addReply;
    (window as any).removeForumReply = removeReply;
    
    return () => {
      delete (window as any).refreshForumReplies;
      delete (window as any).addForumReply;
      delete (window as any).removeForumReply;
    };
  }, []);

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="text-center py-4 text-gray-400">
          Refreshing replies...
        </div>
      )}
      
      {replies.length > 0 && (
        <>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-400" />
            Replies ({replies.length})
          </h2>

          {replies.map((reply) => (
            <div key={reply.id} className="glass border border-green-500/10 rounded-2xl p-6">
              <div className="flex gap-4">
                {/* Author Info */}
                <div className="flex-shrink-0">
                  <Avatar
                    username={reply.author?.username || 'Unknown'}
                    avatar={reply.author?.avatar}
                    size="md"
                  />
                </div>

                {/* Reply Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-white">
                      {reply.author?.username || 'Unknown'}
                    </span>
                    {reply.author?.role && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        reply.author.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                        reply.author.role === 'moderator' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {reply.author.role.charAt(0).toUpperCase() + reply.author.role.slice(1)}
                      </span>
                    )}
                    {reply.author?.donationRankId && rankMap.has(reply.author.donationRankId) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold" style={{
                        backgroundColor: rankMap.get(reply.author.donationRankId)!.color + '20',
                        color: (rankMap.get(reply.author.donationRankId)!.textColor !== '#000000' && rankMap.get(reply.author.donationRankId)!.textColor !== '#000') ? rankMap.get(reply.author.donationRankId)!.textColor : '#ffffff',
                        border: `1px solid ${rankMap.get(reply.author.donationRankId)!.color}40`,
                      }}>
                        <Crown className="h-3 w-3" />
                        {rankMap.get(reply.author.donationRankId)!.badge || rankMap.get(reply.author.donationRankId)!.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(reply.createdAt)}
                  </div>

                  <div className="prose prose-invert max-w-none mb-4">
                    <BBCode className="text-gray-300">{reply.content}</BBCode>
                  </div>

                  {/* Reply Actions */}
                  {session && (
                    <div className="flex items-center gap-2">
                      <ReplyModeration
                        replyId={reply.id}
                        authorId={reply.author?.id || 0}
                        currentUserId={parseInt(session.user.id)}
                        userRole={session.user.role}
                        onUpdate={() => removeReply(reply.id)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Reply Form */}
      {session && (
        <div className="glass border border-green-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Post a Reply</h3>
          <ReplyForm
            postId={postId}
            onReplyPosted={() => refreshReplies()}
          />
        </div>
      )}
    </div>
  );
}
