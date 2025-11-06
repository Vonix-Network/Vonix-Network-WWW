import { requireAdmin } from '@/lib/auth';
import { Server, Activity, Users, Wifi, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Server Management - Admin Panel',
  description: 'Manage Minecraft servers and monitor their status',
};

export default async function AdminServersPage() {
  await requireAdmin();

  // Mock data - replace with actual server data fetching
  const servers = [
    { id: 1, name: 'Survival', status: 'online', players: 45, maxPlayers: 100, motd: 'Main survival server' },
    { id: 2, name: 'Creative', status: 'online', players: 12, maxPlayers: 50, motd: 'Creative building' },
    { id: 3, name: 'Minigames', status: 'offline', players: 0, maxPlayers: 75, motd: 'Fun minigames' },
  ];

  const stats = {
    total: servers.length,
    online: servers.filter(s => s.status === 'online').length,
    totalPlayers: servers.reduce((sum, s) => sum + s.players, 0),
    maxCapacity: servers.reduce((sum, s) => sum + s.maxPlayers, 0),
  };

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

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                      <Server className="h-5 w-5 text-blue-400" />
                    </div>
                    <p className="text-sm text-gray-400">Total Servers</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.total}</p>
                </CardContent>
              </Card>

              <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-green-500/20 p-2 rounded-lg">
                      <Wifi className="h-5 w-5 text-green-400" />
                    </div>
                    <p className="text-sm text-gray-400">Online</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.online}</p>
                </CardContent>
              </Card>

              <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-cyan-500/20 p-2 rounded-lg">
                      <Users className="h-5 w-5 text-cyan-400" />
                    </div>
                    <p className="text-sm text-gray-400">Players Online</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.totalPlayers}</p>
                </CardContent>
              </Card>

              <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-purple-500/20 p-2 rounded-lg">
                      <Activity className="h-5 w-5 text-purple-400" />
                    </div>
                    <p className="text-sm text-gray-400">Capacity</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.maxCapacity}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Server List</h2>
              
              {servers.length === 0 ? (
                <div className="text-center py-16">
                  <Server className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">No servers configured</p>
                  <p className="text-gray-500">Add your first Minecraft server</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {servers.map((server) => (
                    <div
                      key={server.id}
                      className="p-6 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-blue-500/30 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-500/20 p-3 rounded-lg">
                            <Server className="h-6 w-6 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">{server.name}</h3>
                            <p className="text-sm text-gray-400">{server.motd}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {server.status === 'online' ? (
                            <span className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-sm font-semibold">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              Online
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-sm font-semibold">
                              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                              Offline
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-cyan-400" />
                          <span className="font-semibold text-cyan-400">{server.players}</span>
                          <span>/</span>
                          <span>{server.maxPlayers}</span>
                        </div>
                        <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                            style={{ width: `${(server.players / server.maxPlayers) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {Math.round((server.players / server.maxPlayers) * 100)}% full
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mt-6 border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-yellow-400 mb-1">Server Management Coming Soon</p>
                  <p className="text-sm text-gray-400">
                    Full server management functionality including start/stop controls, console access, and configuration editing will be available in a future update.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
