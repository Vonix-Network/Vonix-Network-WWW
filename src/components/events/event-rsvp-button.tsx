'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, UserPlus, Star } from 'lucide-react';
import { toast } from 'sonner';

interface EventRSVPButtonProps {
  eventId: number;
  initialStatus: 'going' | 'interested' | 'not_going' | null;
  isLoggedIn: boolean;
}

export function EventRSVPButton({ eventId, initialStatus, isLoggedIn }: EventRSVPButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'going' | 'interested' | 'not_going' | null>(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRSVP = async (newStatus: 'going' | 'interested' | 'not_going') => {
    if (!isLoggedIn) {
      toast.error('Please log in to RSVP');
      router.push('/login');
      return;
    }

    if (isUpdating) return;

    setIsUpdating(true);
    const previousStatus = status;

    // Optimistic update
    setStatus(newStatus);

    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update RSVP');
      }

      const data = await response.json();
      setStatus(data.status);
      
      toast.success(
        newStatus === 'going' 
          ? 'You\'re going to this event!' 
          : newStatus === 'interested'
          ? 'Marked as interested'
          : 'RSVP removed'
      );

      // Refresh the page to update attendee counts
      router.refresh();
    } catch (error) {
      console.error('Error updating RSVP:', error);
      setStatus(previousStatus);
      toast.error('Failed to update RSVP');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => handleRSVP(status === 'going' ? 'not_going' : 'going')}
        disabled={isUpdating}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
          status === 'going'
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white hover-lift glow-gradient'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {status === 'going' ? (
          <>
            <UserCheck className="h-5 w-5" />
            Going
          </>
        ) : (
          <>
            <UserPlus className="h-5 w-5" />
            I'm Going
          </>
        )}
      </button>

      <button
        onClick={() => handleRSVP(status === 'interested' ? 'not_going' : 'interested')}
        disabled={isUpdating}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
          status === 'interested'
            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
            : 'glass border border-yellow-500/30 hover:border-yellow-500/50 text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Star className="h-5 w-5" />
        {status === 'interested' ? 'Interested' : 'Maybe'}
      </button>
    </div>
  );
}
