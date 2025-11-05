import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import { RBAC } from '@/lib/rbac';

export default async function ModerationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  
  // Require moderator, admin, or superadmin access
  if (!session || !RBAC.canAccessModeration(session.user.role)) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
