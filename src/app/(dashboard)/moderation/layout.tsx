import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';

export default async function ModerationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  
  // Require moderator or admin access
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'admin' && role !== 'moderator')) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
