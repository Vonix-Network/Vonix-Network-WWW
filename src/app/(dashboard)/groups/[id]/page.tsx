'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, Lock, Globe, UserPlus, UserMinus, Settings } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getUserAvatar } from '@/lib/utils';

interface GroupMember {
  id: number;
  userId: number;
  username: string;
  minecraftUsername: string | null;
  avatar: string | null;
  role: string;
  joinedAt: Date;
}

interface GroupData {
  id: number;
  name: string;
  description: string | null;
  coverImage: string | null;
  creatorId: number;
  creatorUsername: string;
  privacy: 'public' | 'private';
  createdAt: Date;
  members: GroupMember[];
  memberCount: number;
  userMembership: GroupMember | null;
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  
  const [group, setGroup] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  const fetchGroup = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setGroup(data);
      } else if (res.status === 404) {
        toast.error('Group not found');
        router.push('/groups');
      }
    } catch (error) {
      console.error('Error fetching group:', error);
      toast.error('Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
      });

      if (res.ok) {
        toast.success('Joined group successfully!');
        fetchGroup();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to join group');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      toast.error('Failed to join group');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Left group successfully');
        router.push('/groups');
      } else {
        toast.error('Failed to leave group');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Failed to leave group');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-gray-800 rounded-lg" />
          <div className="h-32 bg-gray-800 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl text-center">
        <p className="text-gray-400">Group not found</p>
      </div>
    );
  }

  const isMember = !!group.userMembership;
  const isAdmin = group.userMembership?.role === 'admin';

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back Button */}
      <Link
        href="/groups"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Groups
      </Link>

      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg overflow-hidden mb-6">
        {group.coverImage ? (
          <img
            src={group.coverImage}
            alt={group.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users className="w-24 h-24 text-purple-400/50" />
          </div>
        )}
      </div>

      {/* Header */}
      <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{group.name}</h1>
              {group.privacy === 'private' ? (
                <Lock className="w-5 h-5 text-gray-400" />
              ) : (
                <Globe className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <p className="text-gray-400 mb-2">
              Created by {group.creatorUsername} • {group.memberCount} members
            </p>
            {group.description && (
              <p className="text-gray-300">{group.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {isMember ? (
              <>
                {(isAdmin || group.userMembership?.role === 'moderator') && (
                  <Link
                    href={`/groups/${groupId}/members`}
                    className="px-4 py-2 bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-600/30 transition-colors flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Manage Members
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href={`/groups/${groupId}/settings`}
                    className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                )}
                <button
                  onClick={handleLeave}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <UserMinus className="w-4 h-4" />
                  Leave Group
                </button>
              </>
            ) : group.privacy === 'public' ? (
              <button
                onClick={handleJoin}
                disabled={actionLoading}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <UserPlus className="w-5 h-5" />
                Join Group
              </button>
            ) : (
              <div className="px-6 py-3 bg-gray-700/50 rounded-lg text-gray-400 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Private Group
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-400" />
          Members ({group.memberCount})
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {group.members.map((member) => (
            <Link
              key={member.id}
              href={`/profile/${member.username}`}
              className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors"
            >
              <img
                src={getUserAvatar(member.minecraftUsername, member.avatar, 64)}
                alt={member.username}
                className="w-12 h-12 rounded-lg pixelated border-2 border-purple-500/30"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{member.username}</p>
                <p className="text-sm text-gray-400 capitalize">{member.role}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
