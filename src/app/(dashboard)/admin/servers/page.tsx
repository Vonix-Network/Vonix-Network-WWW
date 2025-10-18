import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ServerManagement from '@/components/admin/server-management';

// Force dynamic rendering - NO CACHING
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata = {
  title: 'Server Management - Admin Panel',
  description: 'Manage Minecraft servers and monitor their status',
};

export default async function AdminServersPage() {
  const session = await getServerSession();

  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Server Management</h1>
        <p className="text-gray-400">Monitor and manage your Minecraft servers</p>
      </div>
      
      <ServerManagement />
    </div>
  );
}
