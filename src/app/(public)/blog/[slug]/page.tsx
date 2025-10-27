import { Suspense } from 'react';
import Link from 'next/link';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    username: string;
    avatar: string | null;
    role: string;
  };
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/blog/${slug}`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return null;
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

function BlogContent({ post }: { post: BlogPost }) {
  return (
    <article className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Blog</span>
      </Link>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="aspect-video w-full overflow-hidden rounded-2xl mb-8">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-white mb-4">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-xl text-gray-400 mb-6">
            {post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-6 text-gray-500">
          <div className="flex items-center gap-2">
            {post.author.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author.username}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="font-medium text-white">{post.author.username}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{new Date(post.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="glass border border-blue-500/20 rounded-2xl p-8">
        <div 
          className="prose prose-invert prose-cyan max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl
            prose-p:text-gray-300 prose-p:leading-relaxed
            prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:text-cyan-300
            prose-strong:text-white prose-strong:font-bold
            prose-code:text-cyan-400 prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700
            prose-ul:text-gray-300 prose-ol:text-gray-300
            prose-li:text-gray-300
            prose-blockquote:border-l-cyan-400 prose-blockquote:text-gray-400
            prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>

      {/* Footer */}
      <div className="mt-8 pt-8 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Last updated: {new Date(post.updatedAt).toLocaleDateString()}
          </div>
          <Link
            href="/blog"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            View all posts →
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  // Unwrap params Promise (Next.js 16 requirement)
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <Suspense
          fallback={
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-700 rounded w-32 mb-8" />
                <div className="aspect-video bg-gray-700 rounded-2xl mb-8" />
                <div className="h-12 bg-gray-700 rounded mb-4" />
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-8" />
                <div className="space-y-4">
                  <div className="h-4 bg-gray-700 rounded" />
                  <div className="h-4 bg-gray-700 rounded" />
                  <div className="h-4 bg-gray-700 rounded w-5/6" />
                </div>
              </div>
            </div>
          }
        >
          <BlogContent post={post} />
        </Suspense>
      </div>
    </div>
  );
}
