import { Suspense } from 'react';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { privateMessages, users } from '@/db/schema';
import { desc, eq, or, and, sql } from 'drizzle-orm';
import { MessagesList } from '@/components/messages/messages-list';
import { MessageThread } from '@/components/messages/message-thread';
import { MessagesPageClient } from '@/components/messages/messages-page-client';
import { Mail, Inbox } from 'lucide-react';

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface MessagesPageProps {
  searchParams: { thread?: string };
}

async function MessagesContent({ searchParams, session }: { searchParams: MessagesPageProps['searchParams'], session: any }) {
  const userId = parseInt(session!.user.id);
  const selectedThreadUserId = searchParams.thread ? parseInt(searchParams.thread) : null;

  // Get conversations (unique users we've messaged with)
  const conversations = await db
    .select({
      userId: sql<number>`CASE 
        WHEN ${privateMessages.senderId} = ${userId} THEN ${privateMessages.recipientId}
        ELSE ${privateMessages.senderId}
      END`.as('user_id'),
      username: users.username,
      avatar: users.avatar,
      minecraftUsername: users.minecraftUsername,
      lastMessage: privateMessages.content,
      lastMessageTime: privateMessages.createdAt,
      unreadCount: sql<number>`SUM(CASE 
        WHEN ${privateMessages.recipientId} = ${userId} AND ${privateMessages.read} = 0 
        THEN 1 ELSE 0 
      END)`.as('unread_count'),
    })
    .from(privateMessages)
    .leftJoin(
      users,
      sql`${users.id} = CASE 
        WHEN ${privateMessages.senderId} = ${userId} THEN ${privateMessages.recipientId}
        ELSE ${privateMessages.senderId}
      END`
    )
    .where(
      or(
        eq(privateMessages.senderId, userId),
        eq(privateMessages.recipientId, userId)
      )
    )
    .groupBy(sql`user_id`, users.username, users.avatar, users.minecraftUsername, privateMessages.content, privateMessages.createdAt)
    .orderBy(desc(privateMessages.createdAt))
    .limit(50);

  // Get unique conversations with timestamp conversion
  const uniqueConversations = Array.from(
    new Map(conversations.map(conv => [conv.userId, {
      ...conv,
      lastMessageTime: Math.floor(conv.lastMessageTime.getTime() / 1000),
    }])).values()
  );

  // Get messages for selected thread
  let threadMessages = null;
  let threadUser = null;

  if (selectedThreadUserId) {
    threadMessages = await db
      .select({
        id: privateMessages.id,
        content: privateMessages.content,
        senderId: privateMessages.senderId,
        recipientId: privateMessages.recipientId,
        read: privateMessages.read,
        createdAt: privateMessages.createdAt,
        sender: {
          username: users.username,
          avatar: users.avatar,
        },
      })
      .from(privateMessages)
      .leftJoin(users, eq(privateMessages.senderId, users.id))
      .where(
        or(
          and(
            eq(privateMessages.senderId, userId),
            eq(privateMessages.recipientId, selectedThreadUserId)
          ),
          and(
            eq(privateMessages.senderId, selectedThreadUserId),
            eq(privateMessages.recipientId, userId)
          )
        )
      )
      .orderBy(privateMessages.createdAt);

    // Mark messages as read
    await db
      .update(privateMessages)
      .set({ read: true })
      .where(
        and(
          eq(privateMessages.recipientId, userId),
          eq(privateMessages.senderId, selectedThreadUserId),
          eq(privateMessages.read, false)
        )
      );

    // Get thread user info
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        minecraftUsername: users.minecraftUsername,
      })
      .from(users)
      .where(eq(users.id, selectedThreadUserId));

    threadUser = user;

    // Convert thread message timestamps
    if (threadMessages) {
      threadMessages = threadMessages.map((msg) => ({
        ...msg,
        createdAt: Math.floor(msg.createdAt.getTime() / 1000),
      }));
    }
  }

  return (
    <div className="max-w-7xl mx-auto fade-in-up">
      <MessagesPageClient
        conversations={uniqueConversations as any}
        selectedThreadUserId={selectedThreadUserId}
        threadMessages={threadMessages as any}
        threadUser={threadUser}
        currentUserId={userId}
      />
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="max-w-7xl mx-auto fade-in-up">
      <div className="glass border border-green-500/20 rounded-2xl overflow-hidden">
        <div className="flex h-[600px]">
          {/* Conversations List Skeleton */}
          <div className="w-1/3 border-r border-white/10 p-4">
            <div className="h-8 w-32 bg-gray-700 rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                  <div className="w-12 h-12 bg-gray-700 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mb-2" />
                    <div className="h-3 w-32 bg-gray-700 rounded animate-pulse" />
                  </div>
                  <div className="w-6 h-6 bg-gray-700 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Message Thread Skeleton */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse" />
                <div className="h-6 w-32 bg-gray-700 rounded animate-pulse" />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className="max-w-xs">
                    <div className="h-16 w-48 bg-gray-700 rounded-lg animate-pulse" />
                    <div className="h-3 w-20 bg-gray-700 rounded animate-pulse mt-2" />
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/10">
              <div className="h-12 w-full bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const session = await getServerSession();

  return (
    <Suspense fallback={<MessagesSkeleton />}>
      <MessagesContent searchParams={searchParams} session={session} />
    </Suspense>
  );
}
