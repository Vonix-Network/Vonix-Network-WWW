import { requireAdmin } from '@/lib/auth';
import { DiscordSettings } from '@/components/admin/discord-settings';
import { AdminNavigation } from '@/components/admin/admin-navigation';

export default async function AdminDiscordPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <AdminNavigation />
        
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Discord Integration</span>
          </h1>
          <p className="text-gray-400">
            Manage Discord bot connection and settings
          </p>
        </div>

        <DiscordSettings />
      </div>
    </div>
  );
}