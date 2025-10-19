import { Suspense } from 'react';
import Link from 'next/link';
import { Calendar, User, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  createdAt: Date;
  author: {
    id: number;
    username: string;
    avatar: string | null;
  };
}

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/blog?published=true&limit=20`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.error('Failed to fetch blog posts');
      return [];
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group glass border border-blue-500/20 rounded-2xl overflow-hidden hover-lift hover:border-blue-500/40 transition-all"
    >
      {/* Featured Image */}
      {post.featuredImage && (
        <div className="aspect-video w-full overflow-hidden bg-gray-800">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
          {post.title}
        </h2>

        {post.excerpt && (
          <p className="text-gray-400 mb-4 line-clamp-3">
            {post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{post.author.username}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Read More */}
        <div className="mt-4 flex items-center gap-2 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-sm font-medium">Read More</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

function BlogPostsGrid({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) {
    return (
      <div className="glass border border-blue-500/20 rounded-2xl p-12 text-center">
        <h3 className="text-xl font-bold text-white mb-2">No posts yet</h3>
        <p className="text-gray-400">Check back soon for new content!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <BlogPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12 text-center fade-in-up">
          <h1 className="text-5xl font-bold mb-4">
            <span className="gradient-text-animated">Blog</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Latest news, updates, and stories from the Vonix Network community
          </p>
        </div>

        {/* Blog Posts */}
        <Suspense
          fallback={
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="glass border border-blue-500/20 rounded-2xl p-6 animate-pulse"
                >
                  <div className="h-48 bg-gray-700 rounded-lg mb-4" />
                  <div className="h-6 bg-gray-700 rounded mb-3" />
                  <div className="h-4 bg-gray-700 rounded mb-2" />
                  <div className="h-4 bg-gray-700 rounded w-2/3" />
                </div>
              ))}
            </div>
          }
        >
          <BlogPostsGrid posts={posts} />
        </Suspense>
      </div>
    </div>
  );
}
