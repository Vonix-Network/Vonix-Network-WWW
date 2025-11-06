import { Suspense } from 'react';
import { db } from '@/db';
import { servers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Server, Users, Globe, ExternalLink, Map, Activity, Wifi, Copy, Loader2 } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { fetchServerStatus, formatServerAddress } from '@/lib/server-status';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ServerPageProps {
  params: Promise<{ id: string }>;
}

async function ServerContent({ params }: ServerPageProps) {
  const resolvedParams = await params;
  const serverId = parseInt(resolvedParams.id);

  if (isNaN(serverId)) {
    notFound();
  }

  const [serverRaw] = await db
    .select()
    .from(servers)
    .where(eq(servers.id, serverId));

  if (!serverRaw) {
    notFound();
  }

  let server = serverRaw;
  let playerList: Array<{ name: string; uuid: string }> = [];
  let serverIcon: string | null = null;
  let motd: string | null = null;
  
  try {
    const serverAddress = formatServerAddress(server.ipAddress, server.port);
    const status = await fetchServerStatus(serverAddress);

    if (status.playerList) {
      playerList = status.playerList;
    }

    serverIcon = status.icon || null;
    motd = status.motd || null;

    server = {
      ...server,
      status: status.online ? 'online' : 'offline',
      playersOnline: status.players?.online || 0,
      playersMax: status.players?.max || 0,
      version: status.version || null,
    };
  } catch (error) {
    console.error(`Error fetching server status:`, error);
    server = {
      ...server,
      status: 'offline',
      playersOnline: 0,
      playersMax: 0,
      version: null,
    };
  }

  const serverAddress = `${server.ipAddress}${server.port !== 25565 ? `:${server.port}` : ''}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Back Button */}
          <Link
            href="/servers"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Servers
          </Link>

          {/* Server Header Card */}
          <Card className="border-slate-700 bg-slate-800/50 overflow-hidden">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 blur-3xl"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
                  <div className="flex-1">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{server.name}</h1>
                    {server.description && (
                      <p className="text-gray-300 text-lg mb-4">{server.description}</p>
                    )}
                    {server.modpackName && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full">
                        <Server className="h-4 w-4" />
                        {server.modpackName}
                      </div>
                    )}
                  </div>
                  {server.status === 'online' ? (
                    <span className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full font-semibold">
                      <Wifi className="h-5 w-5" />
                      Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full font-semibold">
                      <Activity className="h-5 w-5" />
                      Offline
                    </span>
                  )}
                </div>

                {/* Server Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Users className="h-4 w-4 text-cyan-400" />
                      <span className="text-sm">Players</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {server.playersOnline} / {server.playersMax}
                    </div>
                  </div>

                  {server.version && (
                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Globe className="h-4 w-4 text-blue-400" />
                        <span className="text-sm">Version</span>
                      </div>
                      <div className="text-xl font-bold text-white">{server.version}</div>
                    </div>
                  )}

                  <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Server className="h-4 w-4 text-purple-400" />
                      <span className="text-sm">IP Address</span>
                    </div>
                    <div className="text-lg font-mono text-purple-400 truncate">{server.ipAddress}</div>
                  </div>

                  {server.port !== 25565 && (
                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Server className="h-4 w-4 text-pink-400" />
                        <span className="text-sm">Port</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{server.port}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Server Address Card */}
          <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Server className="h-6 w-6 text-cyan-400" />
                Connect to Server
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-stretch gap-4">
                <div className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">Server Address</div>
                  <div className="font-mono text-2xl text-cyan-400 font-bold">
                    {serverAddress}
                  </div>
                </div>
                <CopyButton text={serverAddress} />
              </div>
            </CardContent>
          </Card>

          {/* Online Players */}
          {server.status === 'online' && playerList.length > 0 && (
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="h-6 w-6 text-cyan-400" />
                  Online Players ({playerList.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {playerList.map((player) => (
                    <div
                      key={player.uuid}
                      className="flex items-center gap-3 bg-slate-900/50 border border-slate-700 rounded-lg p-3 hover:border-cyan-500/30 transition-all"
                    >
                      <img
                        src={`https://mc-heads.net/avatar/${player.uuid}/32`}
                        alt={player.name}
                        className="w-8 h-8 rounded pixelated"
                      />
                      <span className="text-white font-medium">{player.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bluemap Integration */}
          {server.bluemapUrl && (
            <Card className="border-blue-500/30 bg-slate-800/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Map className="h-6 w-6 text-blue-400" />
                    Live Map
                  </CardTitle>
                  <a
                    href={server.bluemapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in New Tab
                  </a>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden border border-blue-500/20">
                  <iframe
                    src={server.bluemapUrl}
                    className="w-full h-[600px]"
                    title={`${server.name} Bluemap`}
                    allowFullScreen
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Modpack Link */}
          {server.curseforgeUrl && (
            <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-red-500/5">
              <CardHeader>
                <CardTitle className="text-white">Modpack Required</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-6">
                  This server requires a modpack to play. Download it from CurseForge to get started.
                </p>
                <a
                  href={server.curseforgeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/20 transition-all"
                >
                  <ExternalLink className="h-5 w-5" />
                  Download Modpack from CurseForge
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ServerDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Back Button Skeleton */}
          <div className="h-10 w-32 bg-slate-700 rounded animate-pulse" />

          {/* Header Card Skeleton */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
                <div className="flex-1 space-y-4">
                  <div className="h-12 w-64 bg-slate-700 rounded animate-pulse" />
                  <div className="h-6 w-96 bg-slate-700 rounded animate-pulse" />
                  <div className="h-8 w-32 bg-slate-700 rounded-full animate-pulse" />
                </div>
                <div className="h-10 w-24 bg-slate-700 rounded-full animate-pulse" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                    <div className="h-4 w-20 bg-slate-700 rounded animate-pulse mb-2" />
                    <div className="h-8 w-24 bg-slate-700 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Server Address Skeleton */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="p-6">
              <div className="h-8 w-40 bg-slate-700 rounded animate-pulse mb-4" />
              <div className="h-16 w-full bg-slate-700 rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default async function ServerPage({ params }: ServerPageProps) {
  return (
    <Suspense fallback={<ServerDetailSkeleton />}>
      <ServerContent params={params} />
    </Suspense>
  );
}
