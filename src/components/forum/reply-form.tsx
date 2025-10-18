'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { useSession } from 'next-auth/react';
import { Send, Quote } from 'lucide-react';
import { toast } from 'sonner';

interface ReplyFormProps {
  postId: number;
  parentReplyId?: number;
  quotedReplyId?: number;
  quotedContent?: string;
  onReplyPosted?: (newReply?: any) => void;
}

export function ReplyForm({ 
  postId, 
  parentReplyId, 
  quotedReplyId, 
  quotedContent,
  onReplyPosted 
}: ReplyFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    if (content.length > 10000) {
      toast.error('Reply is too long (max 10,000 characters)');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/forum/posts/${postId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          parent_reply_id: parentReplyId,
          quoted_reply_id: quotedReplyId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post reply');
      }

      setContent('');
      toast.success('Reply posted successfully!');
      
      if (onReplyPosted) {
        onReplyPosted(); // We'll fetch the new reply data in the parent component
      } else if ((window as any).refreshForumReplies) {
        (window as any).refreshForumReplies();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start gap-4">
            <Avatar 
              username={session.user?.minecraftUsername || session.user?.name || 'User'}
              avatar={session.user?.avatar}
              size="sm"
            />
            <div className="flex-1 space-y-4">
              {/* Quoted content preview */}
              {quotedContent && (
                <div className="bg-gray-50 dark:bg-gray-800 border-l-4 border-blue-500 p-3 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Quote className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-500">Quoted:</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {quotedContent}
                  </div>
                </div>
              )}

              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={parentReplyId ? "Write your reply..." : "Share your thoughts..."}
                className="min-h-[120px] resize-none"
                maxLength={10000}
              />
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {content.length}/10,000 characters
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !content.trim()}
                    className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Posting...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Post Reply
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
