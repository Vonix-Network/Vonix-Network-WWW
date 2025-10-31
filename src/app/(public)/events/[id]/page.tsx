import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Users, Clock, ArrowLeft, UserCheck, UserPlus } from 'lucide-react';
import { db } from '@/db';
import { events, users, eventAttendees } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { formatDate } from '@/lib/utils';
import { EventRSVPButton } from '@/components/events/event-rsvp-button';
import { auth } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface EventPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function EventContent({ params }: EventPageProps) {
  const session = await auth();
  const resolvedParams = await params;
  const eventId = parseInt(resolvedParams.id);

  if (isNaN(eventId)) {
    notFound();
  }

  // Get event details
  const [event] = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      location: events.location,
      startTime: events.startTime,
      endTime: events.endTime,
      coverImage: events.coverImage,
      creatorId: events.creatorId,
      createdAt: events.createdAt,
      creator: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
      },
    })
    .from(events)
    .leftJoin(users, eq(events.creatorId, users.id))
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) {
    notFound();
  }

  // Get attendees
  const attendees = await db
    .select({
      id: eventAttendees.id,
      status: eventAttendees.status,
      user: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
      },
    })
    .from(eventAttendees)
    .leftJoin(users, eq(eventAttendees.userId, users.id))
    .where(eq(eventAttendees.eventId, eventId));

  const goingCount = attendees.filter(a => a.status === 'going').length;
  const interestedCount = attendees.filter(a => a.status === 'interested').length;

  // Check if current user has RSVP'd
  let userRSVP = null;
  if (session?.user?.id) {
    const [rsvp] = await db
      .select()
      .from(eventAttendees)
      .where(
        sql`${eventAttendees.eventId} = ${eventId} AND ${eventAttendees.userId} = ${parseInt(session.user.id)}`
      )
      .limit(1);
    userRSVP = rsvp?.status || null;
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Link>
      </div>

      {/* Event Header */}
      <section className="container mx-auto px-4 pb-10">
        <div className="glass border border-blue-500/20 rounded-2xl overflow-hidden">
          {/* Cover Image */}
          {event.coverImage ? (
            <div className="relative h-80 overflow-hidden">
              <img
                src={event.coverImage}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
            </div>
          ) : (
            <div className="h-80 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <Calendar className="h-32 w-32 text-blue-400/30" />
            </div>
          )}

          {/* Event Info */}
          <div className="p-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {event.title}
            </h1>

            {/* Event Meta */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-400">Start Time</p>
                  <p className="text-white font-medium">{formatDate(event.startTime)}</p>
                </div>
              </div>

              {event.endTime && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-purple-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-400">End Time</p>
                    <p className="text-white font-medium">{formatDate(event.endTime)}</p>
                  </div>
                </div>
              )}

              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-green-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-400">Location</p>
                    <p className="text-white font-medium">{event.location}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-yellow-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-400">Attendees</p>
                  <p className="text-white font-medium">
                    {goingCount} going • {interestedCount} interested
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-3">About this event</h2>
                <p className="text-gray-300 whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {/* RSVP Button */}
            <div className="flex items-center gap-4 mb-6">
              <EventRSVPButton
                eventId={eventId}
                initialStatus={userRSVP}
                isLoggedIn={!!session}
              />
            </div>

            {/* Creator */}
            {event.creator && (
              <div className="flex items-center gap-3 pt-6 border-t border-white/10">
                {event.creator.avatar ? (
                  <img
                    src={event.creator.avatar}
                    alt={event.creator.username}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
                )}
                <div>
                  <p className="text-sm text-gray-400">Organized by</p>
                  <p className="text-white font-medium">{event.creator.username}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Attendees List */}
      {attendees.length > 0 && (
        <section className="container mx-auto px-4 pb-10">
          <div className="glass border border-blue-500/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Attendees ({goingCount})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {attendees
                .filter(a => a.status === 'going' && a.user)
                .map(attendee => (
                  <div key={attendee.id} className="flex flex-col items-center text-center">
                    {attendee.user?.avatar ? (
                      <img
                        src={attendee.user.avatar}
                        alt={attendee.user.username}
                        className="w-16 h-16 rounded-full mb-2"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-2" />
                    )}
                    <p className="text-sm text-gray-300 truncate w-full">
                      {attendee.user?.username}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function EventSkeleton() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="h-6 w-32 bg-gray-700 rounded animate-pulse" />
      </div>
      <section className="container mx-auto px-4 pb-10">
        <div className="glass border border-blue-500/20 rounded-2xl overflow-hidden">
          <div className="h-80 bg-gray-700 animate-pulse" />
          <div className="p-8 space-y-6">
            <div className="h-12 w-3/4 bg-gray-700 rounded animate-pulse" />
            <div className="grid md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-32 bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function EventPage({ params }: EventPageProps) {
  return (
    <Suspense fallback={<EventSkeleton />}>
      <EventContent params={params} />
    </Suspense>
  );
}
