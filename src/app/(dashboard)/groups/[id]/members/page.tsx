'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Shield, ShieldCheck, User, UserX, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getUserAvatar } from '@/lib/utils';

interface GroupMember {
  id: number;
  userId: number;
  username: string;
  minecraftUsername: string | null;
  avatar: string | null;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: Date;
}

interface GroupData {
  id: number;
  name: string;
  members: GroupMember[];
  userMembership: GroupMember | null;
}

export default function GroupMembersPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  
  const [group, setGroup] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  const fetchGroup = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setGroup(data);
        
        // Check if user has permission
        if (!data.userMembership || (data.userMembership.role !== 'admin' && data.userMembership.role !== 'moderator')) {
          toast.error('You do not have permission to manage members');
          router.push(`/groups/${groupId}`);
        }
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

  const handleRoleChange = async (memberId: number, newRole: string) => {
    setActionLoading(memberId);
    setOpenDropdown(null);
    
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        toast.success('Member role updated');
        fetchGroup();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (memberId: number, username: string) => {
    if (!confirm(`Remove ${username} from the group?`)) return;

    setActionLoading(memberId);
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Member removed');
        fetchGroup();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-purple-400" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-cyan-400" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-600/20 text-purple-400 border-purple-500/30';
      case 'moderator':
        return 'bg-cyan-600/20 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-500/30';
    }
  };

  const canChangeRole = (member: GroupMember) => {
    if (!group?.userMembership) return false;
    
    // Only admins can change roles
    if (group.userMembership.role !== 'admin') return false;
    
    // Can't change your own role
    if (member.userId === group.userMembership.userId) return false;
    
    return true;
  };

  const canRemoveMember = (member: GroupMember) => {
    if (!group?.userMembership) return false;
    
    // Can't remove yourself
    if (member.userId === group.userMembership.userId) return false;
    
    // Admins can remove anyone
    if (group.userMembership.role === 'admin') return true;
    
    // Moderators can only remove regular members
    if (group.userMembership.role === 'moderator' && member.role === 'member') return true;
    
    return false;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-800 rounded-lg" />
          <div className="h-96 bg-gray-800 rounded-lg" />
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

  const admins = group.members.filter(m => m.role === 'admin');
  const moderators = group.members.filter(m => m.role === 'moderator');
  const members = group.members.filter(m => m.role === 'member');

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/groups/${groupId}`}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Group
        </Link>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Manage Members
        </h1>
        <p className="text-gray-400 mt-2">
          {group.name} • {group.members.length} members
        </p>
      </div>

      {/* Admins */}
      <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-purple-400" />
          Administrators ({admins.length})
        </h2>
        <div className="space-y-3">
          {admins.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg"
            >
              <Link href={`/profile/${member.username}`}>
                <img
                  src={getUserAvatar(member.minecraftUsername, member.avatar, 64)}
                  alt={member.username}
                  className="w-12 h-12 rounded-lg pixelated border-2 border-purple-500/30 hover:border-purple-500 transition-colors"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/profile/${member.username}`}
                  className="font-semibold hover:text-purple-400 transition-colors"
                >
                  {member.username}
                </Link>
                <p className="text-sm text-gray-400">
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-lg border text-sm font-semibold ${getRoleBadgeColor(member.role)} flex items-center gap-2`}>
                {getRoleIcon(member.role)}
                Admin
              </div>
              {canRemoveMember(member) && (
                <button
                  onClick={() => handleRemoveMember(member.id, member.username)}
                  disabled={actionLoading === member.id}
                  className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Remove member"
                >
                  <UserX className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Moderators */}
      {moderators.length > 0 && (
        <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-400" />
            Moderators ({moderators.length})
          </h2>
          <div className="space-y-3">
            {moderators.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg"
              >
                <Link href={`/profile/${member.username}`}>
                  <img
                    src={getUserAvatar(member.minecraftUsername, member.avatar, 64)}
                    alt={member.username}
                    className="w-12 h-12 rounded-lg pixelated border-2 border-cyan-500/30 hover:border-cyan-500 transition-colors"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/profile/${member.username}`}
                    className="font-semibold hover:text-cyan-400 transition-colors"
                  >
                    {member.username}
                  </Link>
                  <p className="text-sm text-gray-400">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {canChangeRole(member) && (
                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === member.id ? null : member.id)}
                        disabled={actionLoading === member.id}
                        className={`px-3 py-1 rounded-lg border text-sm font-semibold ${getRoleBadgeColor(member.role)} flex items-center gap-2 hover:bg-cyan-600/30 transition-colors`}
                      >
                        {getRoleIcon(member.role)}
                        Moderator
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {openDropdown === member.id && (
                        <div className="absolute top-full right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[150px]">
                          <button
                            onClick={() => handleRoleChange(member.id, 'admin')}
                            className="w-full px-4 py-2 text-left hover:bg-purple-600/20 flex items-center gap-2 text-purple-400"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Promote to Admin
                          </button>
                          <button
                            onClick={() => handleRoleChange(member.id, 'member')}
                            className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center gap-2"
                          >
                            <User className="w-4 h-4" />
                            Demote to Member
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {!canChangeRole(member) && (
                    <div className={`px-3 py-1 rounded-lg border text-sm font-semibold ${getRoleBadgeColor(member.role)} flex items-center gap-2`}>
                      {getRoleIcon(member.role)}
                      Moderator
                    </div>
                  )}
                  {canRemoveMember(member) && (
                    <button
                      onClick={() => handleRemoveMember(member.id, member.username)}
                      disabled={actionLoading === member.id}
                      className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove member"
                    >
                      <UserX className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular Members */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <User className="w-6 h-6 text-gray-400" />
          Members ({members.length})
        </h2>
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg"
            >
              <Link href={`/profile/${member.username}`}>
                <img
                  src={getUserAvatar(member.minecraftUsername, member.avatar, 64)}
                  alt={member.username}
                  className="w-12 h-12 rounded-lg pixelated border-2 border-gray-700 hover:border-gray-500 transition-colors"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/profile/${member.username}`}
                  className="font-semibold hover:text-gray-300 transition-colors"
                >
                  {member.username}
                </Link>
                <p className="text-sm text-gray-400">
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canChangeRole(member) && (
                  <div className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === member.id ? null : member.id)}
                      disabled={actionLoading === member.id}
                      className={`px-3 py-1 rounded-lg border text-sm font-semibold ${getRoleBadgeColor(member.role)} flex items-center gap-2 hover:bg-gray-700 transition-colors`}
                    >
                      {getRoleIcon(member.role)}
                      Member
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {openDropdown === member.id && (
                      <div className="absolute top-full right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[150px]">
                        <button
                          onClick={() => handleRoleChange(member.id, 'moderator')}
                          className="w-full px-4 py-2 text-left hover:bg-cyan-600/20 flex items-center gap-2 text-cyan-400"
                        >
                          <Shield className="w-4 h-4" />
                          Promote to Moderator
                        </button>
                        <button
                          onClick={() => handleRoleChange(member.id, 'admin')}
                          className="w-full px-4 py-2 text-left hover:bg-purple-600/20 flex items-center gap-2 text-purple-400"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Promote to Admin
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {!canChangeRole(member) && (
                  <div className={`px-3 py-1 rounded-lg border text-sm font-semibold ${getRoleBadgeColor(member.role)} flex items-center gap-2`}>
                    {getRoleIcon(member.role)}
                    Member
                  </div>
                )}
                {canRemoveMember(member) && (
                  <button
                    onClick={() => handleRemoveMember(member.id, member.username)}
                    disabled={actionLoading === member.id}
                    className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Remove member"
                  >
                    <UserX className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
