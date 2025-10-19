import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { events, eventAttendees, users } from '@/db/schema';
import { eq, gte, desc, and, sql } from 'drizzle-orm';
import { z } from 'zod';

// GET /api/events - List events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'upcoming'; // upcoming, past, all
    const limit = parseInt(searchParams.get('limit') || '20');

    let conditions = [];
    const now = new Date();

    if (filter === 'upcoming') {
      conditions.push(gte(events.startTime, now));
    } else if (filter === 'past') {
      conditions.push(sql`${events.startTime} < ${now.getTime() / 1000}`);
    }

    const eventsList = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        location: events.location,
        startTime: events.startTime,
        endTime: events.endTime,
        coverImage: events.coverImage,
        createdAt: events.createdAt,
        creator: {
          id: users.id,
          username: users.username,
          avatar: users.avatar,
        },
        attendeeCount: sql<number>`(
          SELECT COUNT(*) FROM ${eventAttendees}
          WHERE ${eventAttendees.eventId} = ${events.id}
          AND ${eventAttendees.status} = 'going'
        )`,
      })
      .from(events)
      .leftJoin(users, eq(users.id, events.creatorId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(filter === 'past' ? desc(events.startTime) : events.startTime)
      .limit(limit);

    return NextResponse.json(eventsList);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/events - Create event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const schema = z.object({
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      location: z.string().optional(),
      startTime: z.string().datetime(),
      endTime: z.string().datetime().optional(),
      coverImage: z.string().url().optional(),
    });

    const data = schema.parse(body);

    // Validate dates
    const startTime = new Date(data.startTime);
    if (data.endTime) {
      const endTime = new Date(data.endTime);
      if (endTime <= startTime) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        );
      }
    }

    const [event] = await db
      .insert(events)
      .values({
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        startTime,
        endTime: data.endTime ? new Date(data.endTime) : null,
        creatorId: parseInt(session.user.id),
        coverImage: data.coverImage || null,
      })
      .returning();

    // Automatically RSVP creator as "going"
    await db.insert(eventAttendees).values({
      eventId: event.id,
      userId: parseInt(session.user.id),
      status: 'going',
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
