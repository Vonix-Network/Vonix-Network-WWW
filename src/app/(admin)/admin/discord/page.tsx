import { requireAdmin } from '@/lib/auth';
import { DiscordSettings } from '@/components/admin/discord-settings';
import { MessageSquare, Bot, Settings as SettingsIcon, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Discord Integration - Admin Panel',
  description: 'Manage Discord bot connection and settings',
};

export default async function AdminDiscordPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 blur-3xl"></div>
        <div className="container mx-auto px-6 py-12 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-full mb-6">
              <MessageSquare className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">Discord Integration</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Discord
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent"> Bot Settings</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              Configure and manage your Discord bot integration for real-time chat synchronization
            </p>

            {/* Info Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-purple-500/20 p-2 rounded-lg">
                      <Bot className="h-5 w-5 text-purple-400" />
                    </div>
                    <p className="text-sm text-gray-400">Bot Status</p>
                  </div>
                  <p className="text-lg font-bold text-white">Manage Connection</p>
                </CardContent>
              </Card>

              <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                      <SettingsIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <p className="text-sm text-gray-400">Configuration</p>
                  </div>
                  <p className="text-lg font-bold text-white">Token & Webhook</p>
                </CardContent>
              </Card>

              <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-teal-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-cyan-500/20 p-2 rounded-lg">
                      <Zap className="h-5 w-5 text-cyan-400" />
                    </div>
                    <p className="text-sm text-gray-400">Real-time Sync</p>
                  </div>
                  <p className="text-lg font-bold text-white">Live Chat Bridge</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <DiscordSettings />
        </div>
      </div>
    </div>
  );
}