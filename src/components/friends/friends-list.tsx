'use client';

import { useState, useEffect } from 'react';
import { Users, MessageSquare, UserMinus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Friend {
  id: number;
  status: string;
  createdAt: Date;
  isSender: boolean;
  friend: {
    id: number;
    username: string;
    avatar: string | null;
    minecraftUsername: string | null;
  };
}

export function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/friends?status=accepted');
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast.error('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const removeFriend = async (friendshipId: number, username: string) => {
    if (!confirm(`Remove ${username} from your friends?`)) return;

    setRemovingId(friendshipId);
    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Friend removed');
        fetchFriends();
      } else {
        toast.error('Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Failed to remove friend');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="glass border border-blue-500/20 rounded-2xl p-8">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="glass border border-blue-500/20 rounded-2xl p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4">
          <Users className="h-8 w-8 text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No friends yet</h3>
        <p className="text-gray-400 mb-6">
          Start connecting with other members of the community
        </p>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all font-medium"
        >
          <Users className="h-4 w-4" />
          <span>Find Friends</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="glass border border-blue-500/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-cyan-400" />
          Your Friends
        </h2>
        <span className="text-sm text-gray-400">
          {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
        </span>
      </div>

      <div className="space-y-3">
        {friends.map((friendship) => (
          <div
            key={friendship.id}
            className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors"
          >
            {/* Avatar */}
            {friendship.friend.avatar ? (
              <img
                src={friendship.friend.avatar}
                alt={friendship.friend.username}
                className="h-12 w-12 rounded-full"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {friendship.friend.username[0].toUpperCase()}
                </span>
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/profile/${friendship.friend.id}`}
                className="font-medium text-white hover:text-cyan-400 transition-colors"
              >
                {friendship.friend.username}
              </Link>
              {friendship.friend.minecraftUsername && (
                <p className="text-sm text-gray-400">
                  {friendship.friend.minecraftUsername}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link
                href={`/messages?user=${friendship.friend.id}`}
                className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors"
                title="Send message"
              >
                <MessageSquare className="h-4 w-4" />
              </Link>
              <button
                onClick={() => removeFriend(friendship.id, friendship.friend.username)}
                disabled={removingId === friendship.id}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                title="Remove friend"
              >
                {removingId === friendship.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserMinus className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
