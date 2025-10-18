import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import { DashboardNav } from '@/components/dashboard/nav';
import SpaceBackground from '@/components/SpaceBackground';

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
      {/* Space.js Animated Background */}
      <SpaceBackground 
        particles={100}
        speed={0.4}
        gradient={['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#ef4444']}
        size={{ min: 1, max: 2.5 }}
        opacity={{ min: 0.08, max: 0.5 }}
        connectionDistance={100}
        connectionOpacity={0.15}
        mouseInteraction={true}
        animateConnections={true}
        backgroundGradient={false}
      />

      <DashboardNav user={session.user} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
