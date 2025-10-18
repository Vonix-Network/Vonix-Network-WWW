import { db } from '@/db';
import { forumCategories, forumPosts } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import Link from 'next/link';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';

export async function ForumCategories() {
  // Force no caching - always fetch fresh data
  noStore();
  
  // Fetch categories with post counts
  const categories = await db
    .select({
      id: forumCategories.id,
      name: forumCategories.name,
      description: forumCategories.description,
      slug: forumCategories.slug,
      icon: forumCategories.icon,
      postCount: sql<number>`count(${forumPosts.id})`.as('post_count'),
    })
    .from(forumCategories)
    .leftJoin(forumPosts, eq(forumCategories.id, forumPosts.categoryId))
    .groupBy(forumCategories.id)
    .orderBy(forumCategories.orderIndex);

  return (
    <div className="glass border border-blue-500/20 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-blue-400" />
        Categories
      </h2>
      <div className="space-y-2">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/forum/${category.slug}`}
            className="group block glass border border-blue-500/10 hover:border-blue-500/30 rounded-xl p-4 transition-all hover-lift"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-2xl">
                  {category.icon || '📁'}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-400">{category.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">{Number(category.postCount)}</div>
                  <div className="text-xs text-gray-500">Topics</div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-blue-400 transition-colors" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
