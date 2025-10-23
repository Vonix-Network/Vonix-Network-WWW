'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getUserAvatar } from '@/lib/utils';
import StoriesViewer from './stories-viewer';
import CreateStoryModal from './create-story-modal';

interface Story {
  id: number;
  userId: number;
  username: string;
  minecraftUsername: string | null;
  avatar: string | null;
  content: string;
  imageUrl: string | null;
  backgroundColor: string;
  expiresAt: Date;
  createdAt: Date;
  viewCount: number;
  hasViewed: boolean;
}

interface GroupedStories {
  userId: number;
  username: string;
  minecraftUsername: string | null;
  avatar: string | null;
  stories: Story[];
  hasUnviewed: boolean;
}

export default function StoriesBar() {
  const [storiesData, setStoriesData] = useState<GroupedStories[]>([]);
  const [showViewer, setShowViewer] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStories, setSelectedStories] = useState<Story[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const res = await fetch('/api/social/stories');
      if (res.ok) {
        const data = await res.json();
        
        // Group stories by user
        const grouped = data.reduce((acc: Record<number, GroupedStories>, story: Story) => {
          if (!acc[story.userId]) {
            acc[story.userId] = {
              userId: story.userId,
              username: story.username,
              minecraftUsername: story.minecraftUsername,
              avatar: story.avatar,
              stories: [],
              hasUnviewed: false,
            };
          }
          acc[story.userId].stories.push(story);
          if (!story.hasViewed) {
            acc[story.userId].hasUnviewed = true;
          }
          return acc;
        }, {});

        setStoriesData(Object.values(grouped));
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (group: GroupedStories) => {
    setSelectedStories(group.stories);
    setSelectedIndex(0);
    setShowViewer(true);
  };

  if (loading) {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
            <div className="w-16 h-16 bg-gray-700 rounded-full" />
            <div className="w-12 h-3 bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-purple-600">
        {/* Add story button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex flex-col items-center gap-2 flex-shrink-0 group"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <span className="text-xs text-gray-400 group-hover:text-white transition-colors">
            Add Story
          </span>
        </button>

        {/* User stories */}
        {storiesData.map((group) => (
          <button
            key={group.userId}
            onClick={() => handleUserClick(group)}
            className="flex flex-col items-center gap-2 flex-shrink-0 group"
          >
            <div
              className={`w-16 h-16 rounded-full p-0.5 ${
                group.hasUnviewed
                  ? 'bg-gradient-to-br from-purple-600 to-cyan-500'
                  : 'bg-gray-700'
              }`}
            >
              <img
                src={getUserAvatar(group.minecraftUsername, group.avatar, 64)}
                alt={group.username}
                className="w-full h-full rounded-full pixelated border-2 border-gray-900"
              />
            </div>
            <span className="text-xs text-gray-400 group-hover:text-white transition-colors max-w-[64px] truncate">
              {group.username}
            </span>
          </button>
        ))}
      </div>

      {showViewer && (
        <StoriesViewer
          stories={selectedStories}
          initialIndex={selectedIndex}
          onClose={() => {
            setShowViewer(false);
            fetchStories(); // Refresh to update view counts
          }}
        />
      )}

      <CreateStoryModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => fetchStories()}
      />
    </>
  );
}
