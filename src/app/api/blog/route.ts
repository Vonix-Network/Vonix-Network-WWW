import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { blogPosts, users } from '@/db/schema';
import { eq, desc, like, and, or } from 'drizzle-orm';
import { z } from 'zod';

// GET /api/blog - List blog posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published') !== 'false';
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let conditions = [];
    
    // Only show published posts for non-admin users
    const session = await getServerSession();
    if (!session?.user || session.user.role !== 'admin') {
      conditions.push(eq(blogPosts.published, true));
    } else if (published) {
      conditions.push(eq(blogPosts.published, true));
    }

    // Search filter
    if (search) {
      conditions.push(
        or(
          like(blogPosts.title, `%${search}%`),
          like(blogPosts.excerpt, `%${search}%`),
          like(blogPosts.content, `%${search}%`)
        )
      );
    }

    const posts = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        content: blogPosts.content,
        published: blogPosts.published,
        featuredImage: blogPosts.featuredImage,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          avatar: users.avatar,
          role: users.role,
        },
      })
      .from(blogPosts)
      .leftJoin(users, eq(users.id, blogPosts.authorId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(blogPosts.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

// POST /api/blog - Create blog post (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    const schema = z.object({
      title: z.string().min(1).max(200),
      slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
      excerpt: z.string().optional(),
      content: z.string().min(1),
      published: z.boolean().default(false),
      featuredImage: z.string().url().optional(),
    });

    const data = schema.parse(body);

    // Check if slug already exists
    const existing = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, data.slug))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    const [post] = await db
      .insert(blogPosts)
      .values({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        content: data.content,
        authorId: parseInt(session.user.id),
        published: data.published,
        featuredImage: data.featuredImage || null,
      })
      .returning();

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating blog post:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
}
