import { requireAdmin } from '@/lib/auth';
import { SettingsPageClient } from '@/components/admin/settings-page-client';
import { Settings } from 'lucide-react';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requireAdmin();

  return (
    <div className="max-w-7xl mx-auto fade-in-up">
      {/* Header */}
      <div className="glass border border-green-500/20 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-green-400" />
          <div>
            <h1 className="text-3xl font-bold">
              <span className="gradient-text">System Settings</span>
            </h1>
            <p className="text-gray-400">Configure all system settings and integrations</p>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <SettingsPageClient />
    </div>
  );
}
