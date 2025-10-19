import { Suspense } from 'react';
import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BlogManagement } from '@/components/admin/blog-management';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminBlogPage() {
  const session = await getServerSession();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-8 fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text-animated">Blog Management</span>
          </h1>
          <p className="text-gray-400">Create and manage blog posts</p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="glass border border-blue-500/20 rounded-2xl p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-700 rounded w-1/4" />
              <div className="h-64 bg-gray-700 rounded" />
            </div>
          </div>
        }
      >
        <BlogManagement />
      </Suspense>
    </div>
  );
}
