'use client';

import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, UserX, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface AddFriendButtonProps {
  userId: number;
  username: string;
  variant?: 'default' | 'compact';
}

type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'loading';

export function AddFriendButton({ userId, username, variant = 'default' }: AddFriendButtonProps) {
  const [status, setStatus] = useState<FriendshipStatus>('loading');
  const [friendshipId, setFriendshipId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkFriendshipStatus();
  }, [userId]);

  const checkFriendshipStatus = async () => {
    try {
      // Check both pending and accepted friendships
      const [pendingResponse, acceptedResponse] = await Promise.all([
        fetch('/api/friends?status=pending'),
        fetch('/api/friends?status=accepted')
      ]);

      const allFriendships = [];
      
      if (pendingResponse.ok) {
        const pending = await pendingResponse.json();
        allFriendships.push(...pending);
      }
      
      if (acceptedResponse.ok) {
        const accepted = await acceptedResponse.json();
        allFriendships.push(...accepted);
      }

      // Check if friendship exists with this user
      const friendship = allFriendships.find((f: any) => 
        f.friend.id === userId
      );

      if (friendship) {
        setFriendshipId(friendship.id);
        if (friendship.status === 'accepted') {
          setStatus('accepted');
        } else if (friendship.isSender) {
          setStatus('pending_sent');
        } else {
          setStatus('pending_received');
        }
      } else {
        setStatus('none');
      }
    } catch (error) {
      console.error('Error checking friendship status:', error);
      setStatus('none');
    }
  };

  const sendFriendRequest = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: userId }),
      });

      if (response.ok) {
        toast.success(`Friend request sent to ${username}`);
        await checkFriendshipStatus();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    } finally {
      setProcessing(false);
    }
  };

  const cancelFriendRequest = async () => {
    if (!friendshipId) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Friend request cancelled');
        setStatus('none');
        setFriendshipId(null);
      } else {
        toast.error('Failed to cancel request');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request');
    } finally {
      setProcessing(false);
    }
  };

  const acceptFriendRequest = async () => {
    if (!friendshipId) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      });

      if (response.ok) {
        toast.success(`You are now friends with ${username}`);
        setStatus('accepted');
      } else {
        toast.error('Failed to accept request');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    } finally {
      setProcessing(false);
    }
  };

  const rejectFriendRequest = async () => {
    if (!friendshipId) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });

      if (response.ok) {
        toast.success('Friend request rejected');
        setStatus('none');
        setFriendshipId(null);
      } else {
        toast.error('Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  const removeFriend = async () => {
    if (!friendshipId) return;
    if (!confirm(`Remove ${username} from your friends?`)) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Friend removed');
        setStatus('none');
        setFriendshipId(null);
      } else {
        toast.error('Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Failed to remove friend');
    } finally {
      setProcessing(false);
    }
  };

  if (status === 'loading') {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg cursor-not-allowed"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {variant === 'compact' ? '' : 'Loading...'}
      </button>
    );
  }

  if (status === 'accepted') {
    return (
      <button
        onClick={removeFriend}
        disabled={processing}
        className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors disabled:opacity-50"
        title="Remove friend"
      >
        {processing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UserCheck className="h-4 w-4" />
        )}
        {variant === 'compact' ? '' : 'Friends'}
      </button>
    );
  }

  if (status === 'pending_sent') {
    return (
      <button
        onClick={cancelFriendRequest}
        disabled={processing}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors disabled:opacity-50"
        title="Cancel friend request"
      >
        {processing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UserX className="h-4 w-4" />
        )}
        {variant === 'compact' ? '' : 'Request Sent'}
      </button>
    );
  }

  if (status === 'pending_received') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={acceptFriendRequest}
          disabled={processing}
          className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors disabled:opacity-50"
          title="Accept friend request"
        >
          {processing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {variant === 'compact' ? '' : 'Accept'}
        </button>
        <button
          onClick={rejectFriendRequest}
          disabled={processing}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors disabled:opacity-50"
          title="Reject friend request"
        >
          <X className="h-4 w-4" />
          {variant === 'compact' ? '' : 'Reject'}
        </button>
      </div>
    );
  }

  // status === 'none'
  return (
    <button
      onClick={sendFriendRequest}
      disabled={processing}
      className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors disabled:opacity-50"
      title="Send friend request"
    >
      {processing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {variant === 'compact' ? '' : 'Add Friend'}
    </button>
  );
}
