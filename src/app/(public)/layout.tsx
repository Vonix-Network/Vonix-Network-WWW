import { getServerSession } from '@/lib/auth';
import { PublicNav } from '@/components/public/nav';
import SpaceBackground from '@/components/SpaceBackground';

// Force dynamic rendering - NO CACHING
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  
  // Transform session user to match PublicNav expected format
  const user = session?.user ? {
    id: (session.user as any).id || '',
    username: (session.user as any).username || '',
    role: (session.user as any).role || 'user',
  } : undefined;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Space.js Animated Background */}
      <SpaceBackground 
        particles={120}
        speed={0.6}
        gradient={['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#ef4444']}
        size={{ min: 1, max: 3 }}
        opacity={{ min: 0.1, max: 0.7 }}
        connectionDistance={120}
        connectionOpacity={0.2}
        mouseInteraction={true}
        animateConnections={true}
        backgroundGradient={false}
      />

      <PublicNav user={user} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/10 mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-4">
              <a href="/privacy" className="hover:text-blue-400 transition-colors">
                Privacy & Data Protection
              </a>
              <span className="text-gray-600">•</span>
              <a href="https://discord.gg/vonix" className="hover:text-blue-400 transition-colors">
                Discord
              </a>
            </div>
            <div>
              © {new Date().getFullYear()} Vonix Network. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
