import { getServerSession } from '@/lib/auth';
import { UnifiedNav } from '@/components/nav/unified-nav';
import BackgroundWrapper from '@/components/backgrounds/BackgroundWrapper';

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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Admin-Configurable Animated Background - Remounts on route change */}
      <BackgroundWrapper />

      <UnifiedNav user={session?.user} />
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
