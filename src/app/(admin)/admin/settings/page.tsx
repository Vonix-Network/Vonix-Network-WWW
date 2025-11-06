import { requireAdmin } from '@/lib/auth';
import { SettingsPageClient } from '@/components/admin/settings-page-client';
import { Settings, Sliders, Zap, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'System Settings - Admin Panel',
  description: 'Configure all system settings and integrations',
};

export default async function SettingsPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-purple-500/10 blur-3xl"></div>
        <div className="container mx-auto px-6 py-12 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-full mb-6">
              <Settings className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium text-orange-400">System Configuration</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              System
              <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"> Settings</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              Configure integrations, payment methods, security, and customize your platform
            </p>

            {/* Info Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-pink-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-orange-500/20 p-2 rounded-lg">
                      <Sliders className="h-5 w-5 text-orange-400" />
                    </div>
                    <p className="text-sm text-gray-400">Configuration</p>
                  </div>
                  <p className="text-lg font-bold text-white">9 Categories</p>
                </CardContent>
              </Card>

              <Card className="border-pink-500/30 bg-gradient-to-br from-pink-500/5 to-purple-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-pink-500/20 p-2 rounded-lg">
                      <Zap className="h-5 w-5 text-pink-400" />
                    </div>
                    <p className="text-sm text-gray-400">Integrations</p>
                  </div>
                  <p className="text-lg font-bold text-white">Discord, Payments</p>
                </CardContent>
              </Card>

              <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-purple-500/20 p-2 rounded-lg">
                      <Shield className="h-5 w-5 text-purple-400" />
                    </div>
                    <p className="text-sm text-gray-400">Security</p>
                  </div>
                  <p className="text-lg font-bold text-white">Authentication</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <SettingsPageClient />
        </div>
      </div>
    </div>
  );
}
