import { Suspense } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Clock, Plus } from 'lucide-react';
import { db } from '@/db';
import { events, users, eventAttendees } from '@/db/schema';
import { desc, gte, sql } from 'drizzle-orm';
import { formatDate } from '@/lib/utils';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function EventsContent() {
  // Get upcoming events
  const now = new Date();
  const upcomingEvents = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      location: events.location,
      startTime: events.startTime,
      endTime: events.endTime,
      coverImage: events.coverImage,
      creatorId: events.creatorId,
      creator: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
      },
      attendeeCount: sql<number>`(
        SELECT COUNT(*) 
        FROM ${eventAttendees} 
        WHERE ${eventAttendees.eventId} = ${events.id} 
        AND ${eventAttendees.status} = 'going'
      )`,
    })
    .from(events)
    .leftJoin(users, sql`${events.creatorId} = ${users.id}`)
    .where(gte(events.startTime, now))
    .orderBy(events.startTime)
    .limit(20);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center relative">
        <div className="fade-in-up">
          <div className="inline-block mb-4 px-4 py-2 glass rounded-full border border-blue-500/20">
            <span className="text-sm text-blue-400 font-medium">📅 Community Events</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text-animated">Upcoming Events</span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join community events, tournaments, and special activities. Never miss out on the fun!
          </p>

          <Link
            href="/dashboard/events/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover-lift glow-gradient"
          >
            <Plus className="h-5 w-5" />
            Create Event
          </Link>
        </div>
      </section>

      {/* Events Grid */}
      <section className="container mx-auto px-4 py-10 relative">
        {upcomingEvents.length === 0 ? (
          <div className="glass border border-blue-500/20 rounded-2xl p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No upcoming events yet.</p>
            <p className="text-gray-500 text-sm mt-2">Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event, index) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group relative glass border rounded-2xl overflow-hidden hover-lift transition-all"
                style={{
                  borderColor: '#3b82f640',
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                {/* Cover Image */}
                {event.coverImage ? (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.coverImage}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <Calendar className="h-16 w-16 text-blue-400/50" />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {event.title}
                  </h3>

                  {event.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  {/* Event Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <span>{formatDate(event.startTime)}</span>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <MapPin className="h-4 w-4 text-green-400" />
                        <span>{event.location}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-gray-400">
                      <Users className="h-4 w-4 text-purple-400" />
                      <span>{event.attendeeCount} attending</span>
                    </div>
                  </div>

                  {/* Creator */}
                  {event.creator && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                      {event.creator.avatar ? (
                        <img
                          src={event.creator.avatar}
                          alt={event.creator.username}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
                      )}
                      <span className="text-sm text-gray-400">
                        by {event.creator.username}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EventsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Skeleton */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="h-12 w-64 bg-gray-700 rounded-full animate-pulse mx-auto mb-6" />
        <div className="h-16 w-96 bg-gray-700 rounded animate-pulse mx-auto mb-4" />
        <div className="h-6 w-80 bg-gray-700 rounded animate-pulse mx-auto" />
      </section>

      {/* Events Grid Skeleton */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass border border-gray-500/20 rounded-2xl overflow-hidden">
              <div className="h-48 bg-gray-700 animate-pulse" />
              <div className="p-6 space-y-4">
                <div className="h-6 w-3/4 bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<EventsSkeleton />}>
      <EventsContent />
    </Suspense>
  );
}
