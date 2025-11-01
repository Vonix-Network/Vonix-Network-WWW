import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  // Require admin access
  if (!session || session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Hide the global site navigation within admin routes */}
      <style suppressHydrationWarning>{`
        /* The public/dashboard UnifiedNav renders as a top sticky <nav>. We hide it in admin. */
        nav.glass.sticky.top-0 { display: none !important; }
      `}</style>

      {/* Sidebar - Fixed on left */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Admin Header */}
        <AdminHeader user={session.user} />

        {/* Page Content - Scrollable (full width, no extra padding) */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full p-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
