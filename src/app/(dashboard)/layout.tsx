import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import { UnifiedNav } from '@/components/nav/unified-nav';
import BackgroundWrapper from '@/components/backgrounds/BackgroundWrapper';

// Force dynamic rendering - NO CACHING
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Admin-Configurable Animated Background - Remounts on route change */}
      <BackgroundWrapper />

      <UnifiedNav user={session.user} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
