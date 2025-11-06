/**
 * Enterprise Admin Layout
 * Professional sidebar + header layout
 */

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import { RBAC } from '@/lib/rbac';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminHeader } from '@/components/layout/admin-header';

export default async function EnterpriseAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session || !RBAC.canAccessAdmin(session.user.role)) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64">
        {/* Header */}
        <AdminHeader />
        
        {/* Page Content */}
        <main className="min-h-[calc(100vh-73px)]">
          {children}
        </main>
      </div>
    </div>
  );
}
