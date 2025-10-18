import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { socialComments, socialPosts, users, donationRanks } from '@/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import { z } from 'zod';

const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parent_comment_id: z.number().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const postId = parseInt(params.id);
    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    // Check if post exists
    const [post] = await db
      .select({ id: socialPosts.id })
      .from(socialPosts)
      .where(eq(socialPosts.id, postId))
      .limit(1);

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = createCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { content, parent_comment_id } = validation.data;

    // Validate parent comment exists if specified
    if (parent_comment_id) {
      const [parentComment] = await db
        .select({ id: socialComments.id })
        .from(socialComments)
        .where(
          and(
            eq(socialComments.id, parent_comment_id),
            eq(socialComments.postId, postId)
          )
        )
        .limit(1);

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 400 }
        );
      }
    }

    // Create the comment
    const [newComment] = await db
      .insert(socialComments)
      .values({
        postId: postId,
        userId: parseInt(session.user.id),
        content,
        parentCommentId: parent_comment_id || null,
      })
      .returning();

    // Get the comment with author info
    const [commentWithAuthor] = await db
      .select({
        id: socialComments.id,
        content: socialComments.content,
        createdAt: socialComments.createdAt,
        updatedAt: socialComments.updatedAt,
        parentCommentId: socialComments.parentCommentId,
        likesCount: socialComments.likesCount,
        userId: socialComments.userId,
        author: {
          id: users.id,
          username: users.username,
          minecraftUsername: users.minecraftUsername,
          avatar: users.avatar,
          role: users.role,
          donationRankId: users.donationRankId,
        },
      })
      .from(socialComments)
      .leftJoin(users, eq(socialComments.userId, users.id))
      .where(eq(socialComments.id, newComment.id))
      .limit(1);

    return NextResponse.json({
      success: true,
      comment: commentWithAuthor,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating social comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = parseInt(params.id);
    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sort') || 'newest'; // newest, oldest, popular

    let orderBy;
    switch (sortBy) {
      case 'oldest':
        orderBy = asc(socialComments.createdAt);
        break;
      case 'popular':
        orderBy = desc(socialComments.likesCount);
        break;
      case 'newest':
      default:
        orderBy = desc(socialComments.createdAt);
        break;
    }

    // Get all comments for the post
    const comments = await db
      .select({
        id: socialComments.id,
        content: socialComments.content,
        createdAt: socialComments.createdAt,
        updatedAt: socialComments.updatedAt,
        parentCommentId: socialComments.parentCommentId,
        likesCount: socialComments.likesCount,
        userId: socialComments.userId,
        author: {
          id: users.id,
          username: users.username,
          minecraftUsername: users.minecraftUsername,
          avatar: users.avatar,
          role: users.role,
          donationRankId: users.donationRankId,
        },
      })
      .from(socialComments)
      .leftJoin(users, eq(socialComments.userId, users.id))
      .where(eq(socialComments.postId, postId))
      .orderBy(orderBy);

    // Organize comments into threads (parent comments with their replies)
    const parentComments = comments.filter(comment => !comment.parentCommentId);
    const replyComments = comments.filter(comment => comment.parentCommentId);

    const threaded = parentComments.map(parent => ({
      ...parent,
      replies: replyComments
        .filter(reply => reply.parentCommentId === parent.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }));

    return NextResponse.json({
      success: true,
      comments: threaded,
      total: comments.length,
    });

  } catch (error) {
    console.error('Error fetching social comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
