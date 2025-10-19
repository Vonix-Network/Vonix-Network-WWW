import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface NewMessagePageProps {
  searchParams: { to?: string };
}

export default async function NewMessagePage({ searchParams }: NewMessagePageProps) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const toUsername = searchParams.to;

  if (!toUsername) {
    // No username provided, redirect to messages page
    redirect('/messages');
  }

  // Look up user by username
  const [targetUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, toUsername))
    .limit(1);

  if (!targetUser) {
    // User not found, redirect to messages page
    redirect('/messages');
  }

  // Redirect to messages page with thread parameter
  redirect(`/messages?thread=${targetUser.id}`);
}
