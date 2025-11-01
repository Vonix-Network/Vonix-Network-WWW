import { getServerSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryForm } from '@/components/moderation/category-form';
import { db } from '@/db';
import { forumCategories } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function EditCategoryPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession();
  const role = (session?.user as any)?.role;

  if (!session || (role !== 'admin' && role !== 'moderator')) {
    redirect('/dashboard');
  }

  const categoryId = parseInt(params.id);
  if (isNaN(categoryId)) {
    notFound();
  }

  const [category] = await db
    .select()
    .from(forumCategories)
    .where(eq(forumCategories.id, categoryId))
    .limit(1);

  if (!category) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in-up">
      <div className="flex items-center gap-4">
        <Link href="/moderation">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Edit Category</h1>
          <p className="text-gray-400 mt-1">Update category settings and permissions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
          <CardDescription>
            Modify category information and organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryForm category={category} />
        </CardContent>
      </Card>
    </div>
  );
}
