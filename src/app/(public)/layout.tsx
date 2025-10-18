import { getServerSession } from '@/lib/auth';
import { PublicNav } from '@/components/public/nav';

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
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 animate-gradient-xy" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

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
