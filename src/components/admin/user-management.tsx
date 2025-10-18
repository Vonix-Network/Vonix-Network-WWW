'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { MoreVertical, Shield, UserCog, Trash2, Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { formatTimeAgo } from '@/lib/date-utils';
import { UserModal } from './user-modal';

interface User {
  id: number;
  username: string;
  email: string | null;
  role: string;
  createdAt: number;
  minecraftUsername: string | null;
  bio?: string | null;
}

interface UserManagementProps {
  users: User[];
}

export function UserManagement({ users: initialUsers }: UserManagementProps) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

  const handleDropdownToggle = (userId: number) => {
    if (selectedUser === userId) {
      setSelectedUser(null);
      setDropdownPosition(null);
    } else {
      const button = buttonRefs.current[userId];
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left - 180 + rect.width,
        });
      }
      setSelectedUser(userId);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedUser !== null) {
        const target = event.target as HTMLElement;
        if (!target.closest('.user-dropdown') && !target.closest('.dropdown-button')) {
          setSelectedUser(null);
          setDropdownPosition(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedUser]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    setIsUpdating(true);

    try {
      const response = await fetch('/api/admin/users/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }

      toast.success(`User role updated to ${newRole}`);
      setSelectedUser(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      toast.success('User deleted successfully');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
        />
      )}

      <div className="glass border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserCog className="h-5 w-5 text-blue-400" />
            User Management
          </h2>
          <button
            onClick={() => {
              setEditingUser(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover-lift glow-green"
          >
            <Plus className="h-4 w-4" />
            Create User
          </button>
        </div>

        <div className="space-y-2">
          {initialUsers.map((user) => (
          <div
            key={user.id}
            className="glass border border-white/10 rounded-xl p-4 hover:border-blue-500/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      {user.username}
                      {user.role === 'admin' && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                          Admin
                        </span>
                      )}
                      {user.role === 'moderator' && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                          Moderator
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.email || user.minecraftUsername || 'No email'} •{' '}
                      {formatTimeAgo(user.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <button
                  ref={(el) => {
                    buttonRefs.current[user.id] = el;
                  }}
                  onClick={() => handleDropdownToggle(user.id)}
                  disabled={isUpdating}
                  className="dropdown-button p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>

                {selectedUser === user.id && dropdownPosition && createPortal(
                  <div 
                    className="user-dropdown fixed glass border border-white/20 rounded-lg overflow-hidden shadow-xl z-[9999] min-w-[180px]"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
                    }}
                  >
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleRoleChange(user.id, 'admin')}
                        disabled={isUpdating}
                        className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors w-full text-left text-sm"
                      >
                        <Shield className="h-4 w-4" />
                        Make Admin
                      </button>
                    )}
                    {user.role !== 'moderator' && user.role !== 'admin' && (
                      <button
                        onClick={() => handleRoleChange(user.id, 'moderator')}
                        disabled={isUpdating}
                        className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-purple-500/10 transition-colors w-full text-left text-sm"
                      >
                        <Shield className="h-4 w-4" />
                        Make Moderator
                      </button>
                    )}
                    {user.role !== 'user' && (
                      <button
                        onClick={() => handleRoleChange(user.id, 'user')}
                        disabled={isUpdating}
                        className="flex items-center gap-2 px-4 py-2 text-blue-400 hover:bg-blue-500/10 transition-colors w-full text-left text-sm"
                      >
                        <Shield className="h-4 w-4" />
                        Make User
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setShowModal(true);
                        setSelectedUser(null);
                      }}
                      disabled={isUpdating}
                      className="flex items-center gap-2 px-4 py-2 text-blue-400 hover:bg-blue-500/10 transition-colors w-full text-left text-sm"
                    >
                      <Edit className="h-4 w-4" />
                      Edit User
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      disabled={isUpdating}
                      className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors w-full text-left text-sm border-t border-white/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete User
                    </button>
                  </div>,
                  document.body
                )}
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>
    </>
  );
}
