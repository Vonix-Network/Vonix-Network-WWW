import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';

// Force dynamic rendering - NO CACHING
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  
  // Redirect logged-in users to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return children;
}
