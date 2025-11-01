import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryForm } from '@/components/moderation/category-form';

export default async function NewCategoryPage() {
  const session = await getServerSession();
  const role = (session?.user as any)?.role;

  if (!session || (role !== 'admin' && role !== 'moderator')) {
    redirect('/dashboard');
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
          <h1 className="text-3xl font-bold text-white">Create Forum Category</h1>
          <p className="text-gray-400 mt-1">Add a new category to organize forum discussions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
          <CardDescription>
            Categories help organize forum posts by topic or theme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryForm />
        </CardContent>
      </Card>
    </div>
  );
}
