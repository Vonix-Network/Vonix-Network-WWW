import { Suspense } from 'react';
import { db } from '@/db';
import { servers } from '@/db/schema';
import { desc } from 'drizzle-orm';
import Link from 'next/link';
import { Server, Users, Globe, ExternalLink, Map, Wifi, WifiOff, ArrowRight } from 'lucide-react';
import { fetchServerStatus, formatServerAddress } from '@/lib/server-status';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Servers - Vonix Network',
  description: 'Browse our Minecraft servers and join the community',
};

async function fetchServerStatusForDisplay(server: any) {
  try {
    const serverAddress = formatServerAddress(server.ipAddress, server.port);
    const status = await fetchServerStatus(serverAddress);

    return {
      ...server,
      status: status.online ? 'online' : 'offline',
      playersOnline: status.players?.online || 0,
      playersMax: status.players?.max || 0,
      version: status.version || null,
      motd: status.motd || null,
      icon: status.icon || null,
    };
  } catch (error) {
    console.error(`Error fetching server status for ${server.name}:`, error);
    return {
      ...server,
      status: 'offline',
      playersOnline: 0,
      playersMax: 0,
      version: null,
    };
  }
}

async function ServersContent() {
  const serverListRaw = await db
    .select()
    .from(servers)
    .orderBy(servers.orderIndex, desc(servers.createdAt));

  const serverList = await Promise.all(
    serverListRaw.map(server => fetchServerStatusForDisplay(server))
  );

  const onlineCount = serverList.filter(s => s.status === 'online').length;
  const totalPlayers = serverList.reduce((sum, s) => sum + s.playersOnline, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 blur-3xl"></div>
        <div className="container mx-auto px-6 py-16 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-full mb-6">
              <Server className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Minecraft Servers</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Choose Your
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"> Adventure</span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Join one of our Minecraft servers and start your adventure today!
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-gray-400">
                  <span className="text-white font-semibold">{onlineCount}</span> Online
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                <span className="text-gray-400">
                  <span className="text-white font-semibold">{totalPlayers}</span> Players
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 pb-16">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Server List */}
          {serverList.length === 0 ? (
            <Card className="border-slate-700 bg-slate-800/50">
              <CardContent className="p-16 text-center">
                <Server className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No servers available at the moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {serverList.map((server) => (
                <Link
                  key={server.id}
                  href={`/servers/${server.id}`}
                  className="group"
                >
                  <Card className="border-slate-700 bg-slate-800/50 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 h-full">
                    <CardContent className="p-6">
                      {/* Server Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                            {server.name}
                          </h3>
                          {server.modpackName && (
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-sm">
                              <Server className="h-3 w-3" />
                              {server.modpackName}
                            </div>
                          )}
                        </div>
                        {server.status === 'online' ? (
                          <span className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-sm font-semibold">
                            <Wifi className="w-3 h-3" />
                            Online
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-sm font-semibold">
                            <WifiOff className="w-3 h-3" />
                            Offline
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {server.description && (
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{server.description}</p>
                      )}

                      {/* Server Stats */}
                      {server.status === 'online' && (
                        <div className="flex items-center gap-6 mb-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Users className="h-4 w-4 text-cyan-400" />
                            <span className="font-semibold text-cyan-400">{server.playersOnline}</span>
                            <span>/</span>
                            <span>{server.playersMax}</span>
                          </div>
                          {server.version && (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Globe className="h-4 w-4" />
                              <span>{server.version}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Player Progress Bar */}
                      {server.status === 'online' && server.playersMax > 0 && (
                        <div className="mb-4">
                          <div className="flex-1 bg-slate-900/50 rounded-full h-2 overflow-hidden border border-slate-700">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                              style={{ width: `${Math.min((server.playersOnline / server.playersMax) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Server Address */}
                      <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 mb-4">
                        <div className="text-xs text-gray-500 mb-1">Server Address</div>
                        <div className="font-mono text-cyan-400 text-sm font-semibold">
                          {server.ipAddress}{server.port !== 25565 ? `:${server.port}` : ''}
                        </div>
                      </div>

                      {/* Quick Links */}
                      {(server.bluemapUrl || server.curseforgeUrl) && (
                        <div className="flex gap-2 mb-4">
                          {server.bluemapUrl && (
                            <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-sm hover:bg-blue-500/20 transition-colors">
                              <Map className="h-4 w-4" />
                              Map
                            </div>
                          )}
                          {server.curseforgeUrl && (
                            <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-lg text-sm hover:bg-orange-500/20 transition-colors">
                              <ExternalLink className="h-4 w-4" />
                              Modpack
                            </div>
                          )}
                        </div>
                      )}

                      {/* View Details Button */}
                      <div className="flex items-center justify-end text-cyan-400 text-sm font-medium group-hover:gap-2 transition-all">
                        View Details
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* How to Join Section */}
          <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Server className="h-6 w-6 text-cyan-400" />
                How to Join
              </h2>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg">
                    1
                  </div>
                  <h3 className="font-semibold text-white text-lg">Copy Server Address</h3>
                  <p className="text-gray-400">
                    Click on a server card and copy the server address shown
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg">
                    2
                  </div>
                  <h3 className="font-semibold text-white text-lg">Open Minecraft</h3>
                  <p className="text-gray-400">
                    Launch Minecraft and navigate to the Multiplayer menu
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg">
                    3
                  </div>
                  <h3 className="font-semibold text-white text-lg">Add Server & Play</h3>
                  <p className="text-gray-400">
                    Add the server with the copied address and start playing!
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

function ServersSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header Skeleton */}
          <div className="text-center space-y-4">
            <div className="h-12 w-64 bg-slate-700 rounded animate-pulse mx-auto" />
            <div className="h-6 w-96 bg-slate-700 rounded animate-pulse mx-auto" />
          </div>

          {/* Server Cards Skeleton */}
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-slate-700 bg-slate-800/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-8 w-48 bg-slate-700 rounded animate-pulse" />
                    <div className="h-6 w-16 bg-slate-700 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-full bg-slate-700 rounded animate-pulse mb-4" />
                  <div className="h-12 bg-slate-700 rounded animate-pulse mb-4" />
                  <div className="flex gap-2">
                    <div className="flex-1 h-8 bg-slate-700 rounded animate-pulse" />
                    <div className="flex-1 h-8 bg-slate-700 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServersPage() {
  return (
    <Suspense fallback={<ServersSkeleton />}>
      <ServersContent />
    </Suspense>
  );
}
