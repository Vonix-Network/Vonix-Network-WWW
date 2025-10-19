import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const VALID_BACKGROUNDS = ['space', 'matrix', 'data', 'pixels', 'neural', 'none'] as const;

type BackgroundType = typeof VALID_BACKGROUNDS[number];

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db
    .select({ preferredBackground: users.preferredBackground })
    .from(users)
    .where(eq(users.id, parseInt(session.user.id)));

  return NextResponse.json({ preferredBackground: user?.preferredBackground ?? null });
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { background } = body as { background?: string | null };

  // Allow null to mean "inherit site default"
  if (background !== null && background !== undefined) {
    if (!VALID_BACKGROUNDS.includes(background as BackgroundType)) {
      return NextResponse.json({ error: 'Invalid background type' }, { status: 400 });
    }
  }

  await db
    .update(users)
    .set({ preferredBackground: background ?? null })
    .where(eq(users.id, parseInt(session.user.id)));

  return NextResponse.json({ ok: true });
}
