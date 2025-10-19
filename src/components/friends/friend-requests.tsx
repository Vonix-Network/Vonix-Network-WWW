'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FriendRequest {
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

export function FriendRequests() {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/friends?status=pending');
      if (response.ok) {
        const data = await response.json();
        // Only show requests where current user is the recipient (not sender)
        setRequests(data.filter((r: FriendRequest) => !r.isSender));
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRequest = async (friendshipId: number, action: 'accept' | 'reject') => {
    setProcessingId(friendshipId);
    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        toast.success(action === 'accept' ? 'Friend request accepted' : 'Friend request rejected');
        fetchRequests();
      } else {
        toast.error(`Failed to ${action} request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      toast.error(`Failed to ${action} request`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (requests.length === 0) {
    return null; // Don't show section if no requests
  }

  return (
    <div className="glass border border-blue-500/20 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="h-5 w-5 text-cyan-400" />
        <h2 className="text-xl font-bold text-white">Friend Requests</h2>
        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded-full">
          {requests.length}
        </span>
      </div>

      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center gap-4 p-4 rounded-lg bg-blue-500/5 border border-blue-500/10"
          >
            {/* Avatar */}
            {request.friend.avatar ? (
              <img
                src={request.friend.avatar}
                alt={request.friend.username}
                className="h-12 w-12 rounded-full"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {request.friend.username[0].toUpperCase()}
                </span>
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white">
                {request.friend.username}
              </p>
              {request.friend.minecraftUsername && (
                <p className="text-sm text-gray-400">
                  {request.friend.minecraftUsername}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRequest(request.id, 'accept')}
                disabled={processingId === request.id}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 font-medium"
                title="Accept"
              >
                {processingId === request.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span className="hidden sm:inline">Accept</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleRequest(request.id, 'reject')}
                disabled={processingId === request.id}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 font-medium"
                title="Reject"
              >
                {processingId === request.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline">Reject</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
