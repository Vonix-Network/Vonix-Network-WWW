'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReplyForm } from './reply-form';
import { Quote, Reply, Flag, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface ReplyData {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  parent_reply_id: number | null;
  quoted_reply_id: number | null;
  author_id: number;
  author_username: string;
  author_avatar: string | null;
  author_role: string;
}

interface ReplyCardProps {
  reply: ReplyData;
  canModerate: boolean;
  currentUserId?: number;
  level?: number;
  quotedReply?: ReplyData;
}

export function ReplyCard({ 
  reply, 
  canModerate, 
  currentUserId, 
  level = 0,
  quotedReply 
}: ReplyCardProps) {
  const router = useRouter();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showQuoted, setShowQuoted] = useState(false);

  const isAuthor = currentUserId === reply.author_id;
  const isNested = level > 0;
  const maxNestingLevel = 3;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this reply?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/forum/replies/${reply.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete reply');
      }

      toast.success('Reply deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast.error('Failed to delete reply');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuote = () => {
    setShowReplyForm(true);
  };

  return (
    <div className={`${isNested ? 'ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}`}>
      <Card className={`${isNested ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar 
                username={reply.author_username} 
                avatar={reply.author_avatar}
                size="sm"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{reply.author_username}</span>
                  <Badge variant={reply.author_role === 'admin' ? 'destructive' : 'secondary'}>
                    {reply.author_role}
                  </Badge>
                  {level > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Reply
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(reply.created_at).toLocaleString()}
                  {reply.updated_at !== reply.created_at && (
                    <span className="ml-2 text-xs">(edited)</span>
                  )}
                </span>
              </div>
            </div>
            
            <div className="flex gap-1">
              {quotedReply && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowQuoted(!showQuoted)}
                >
                  {showQuoted ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleQuote}>
                <Quote className="h-4 w-4" />
              </Button>
              {level < maxNestingLevel && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                >
                  <Reply className="h-4 w-4" />
                </Button>
              )}
              {isAuthor && (
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {(canModerate || isAuthor) && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              {canModerate && !isAuthor && (
                <Button variant="ghost" size="sm">
                  <Flag className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Show quoted content if expanded */}
          {quotedReply && showQuoted && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Quote className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-500">
                  {quotedReply.author_username} wrote:
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {quotedReply.content.length > 200 
                  ? `${quotedReply.content.substring(0, 200)}...`
                  : quotedReply.content
                }
              </div>
            </div>
          )}

          {/* Reply content */}
          <div className="prose dark:prose-invert max-w-none">
            {reply.content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-3 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Nested reply form */}
      {showReplyForm && (
        <div className="mt-4">
          <ReplyForm 
            postId={0} // Will be passed from parent
            parentReplyId={reply.id}
            quotedReplyId={reply.id}
            quotedContent={reply.content}
            onReplyPosted={() => {
              setShowReplyForm(false);
              router.refresh();
            }}
          />
        </div>
      )}
    </div>
  );
}
