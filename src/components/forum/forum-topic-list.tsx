'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, Pin, Lock, Eye } from 'lucide-react';
import { formatTimeAgo, stripBBCode } from '@/lib/date-utils';

interface Topic {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  locked: boolean;
  views: number;
  createdAt: Date;
  author: {
    username: string;
  } | null;
  replyCount: number;
}

interface ForumTopicListProps {
  categorySlug: string;
  categoryId: number;
  initialTopics: Topic[];
}

export function ForumTopicList({ categorySlug, categoryId, initialTopics }: ForumTopicListProps) {
  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const [isLoading, setIsLoading] = useState(false);

  // Function to refresh topics from server
  const refreshTopics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/forum/categories/${categoryId}/topics`);
      if (response.ok) {
        const data = await response.json();
        setTopics(data.topics || []);
      }
    } catch (error) {
      console.error('Failed to refresh topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to remove a topic from the list (for immediate UI update)
  const removeTopic = (topicId: number) => {
    setTopics(prevTopics => prevTopics.filter(topic => topic.id !== topicId));
  };

  // Expose refresh function globally for deletion handlers
  useEffect(() => {
    (window as any).refreshForumTopics = refreshTopics;
    (window as any).removeForumTopic = removeTopic;
    
    return () => {
      delete (window as any).refreshForumTopics;
      delete (window as any).removeForumTopic;
    };
  }, []);

  return (
    <div className="glass border border-green-500/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">
          Topics ({topics.length})
        </h2>
        {isLoading && (
          <div className="text-sm text-gray-400">Refreshing...</div>
        )}
      </div>

      {topics.length > 0 ? (
        <div className="space-y-2">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/forum/${categorySlug}/${topic.id}`}
              className="group block glass border border-green-500/10 hover:border-green-500/30 rounded-xl p-4 transition-all hover-lift"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {topic.pinned && <Pin className="h-4 w-4 text-green-400" />}
                    {topic.locked && <Lock className="h-4 w-4 text-gray-400" />}
                    <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors">
                      {topic.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                    {stripBBCode(topic.content)}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>by {topic.author?.username || 'Unknown'}</span>
                    <span>{formatTimeAgo(topic.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm ml-4">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Eye className="h-4 w-4" />
                    <span>{topic.views}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <MessageSquare className="h-4 w-4" />
                    <span>{topic.replyCount}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No topics yet. Be the first to start a discussion!</p>
        </div>
      )}
    </div>
  );
}
