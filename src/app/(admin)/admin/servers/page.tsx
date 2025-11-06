import { requireAdmin } from '@/lib/auth';
import { Server } from 'lucide-react';
import { ServerManagementClient } from '@/components/admin/server-management-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Server Management - Admin Panel',
  description: 'Manage Minecraft servers and monitor their status',
};

export default async function AdminServersPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 blur-3xl"></div>
        <div className="container mx-auto px-6 py-12 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full mb-6">
              <Server className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Server Management</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Minecraft
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent"> Servers</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              Monitor server status, manage configurations, and track player activity
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <ServerManagementClient />
        </div>
      </div>
    </div>
  );
}
