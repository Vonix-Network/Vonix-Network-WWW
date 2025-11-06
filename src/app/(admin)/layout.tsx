import BackgroundWrapper from '@/components/backgrounds/BackgroundWrapper';

// Force dynamic rendering - NO CACHING
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Admin-Configurable Animated Background */}
      <BackgroundWrapper />
      
      {/* No nav here - admin pages have their own layout with sidebar */}
      {children}
    </div>
  );
}
