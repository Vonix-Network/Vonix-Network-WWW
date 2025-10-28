import { Suspense } from 'react';
import { db } from '@/db';
import { servers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Server, Users, Globe, Copy, ExternalLink, Map, Activity } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { fetchServerStatus, formatServerAddress } from '@/lib/server-status';

// Force dynamic rendering and disable all caching
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

  // Fetch real-time status from mcstatus.io (live data only, no database update)
  let server = serverRaw;
  let playerList: Array<{ name: string; uuid: string }> = [];
  let serverIcon: string | null = null;
  let motd: string | null = null;
  
  try {
    const serverAddress = formatServerAddress(server.ipAddress, server.port);
    const status = await fetchServerStatus(serverAddress);
    
    // Debug logging
    console.log('mcstatus.io response:', {
      online: status.online,
      players: status.players,
      version: status.version,
    });

    // Get player list
    if (status.playerList) {
      playerList = status.playerList;
    }

    // Get server icon and MOTD
    serverIcon = status.icon || null;
    motd = status.motd || null;

    // Update local server object with live data (no database update)
    server = {
      ...server,
      status: status.online ? 'online' : 'offline',
      playersOnline: status.players?.online || 0,
      playersMax: status.players?.max || 0,
      version: status.version || null,
    };
    
    console.log('Server after update:', {
      playersOnline: server.playersOnline,
      playersMax: server.playersMax,
      status: server.status,
    });
  } catch (error) {
    console.error(`Error fetching server status:`, error);
    // Set server as offline on error
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
    <div>
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        {/* Back Button */}
        <Link
          href="/servers"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Servers
        </Link>

        {/* Server Header */}
        <div className="glass border border-blue-500/20 rounded-2xl p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-3">{server.name}</h1>
              {server.modpackName && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-full">
                  <Server className="h-4 w-4" />
                  {server.modpackName}
                </div>
              )}
            </div>
            <div className={`px-4 py-2 rounded-full font-medium ${
              server.status === 'online' 
                ? 'bg-green-500/20 text-blue-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {server.status === 'online' ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>

          {server.description && (
            <p className="text-gray-300 text-lg mb-6">{server.description}</p>
          )}

          {/* Server Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">Players</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {server.playersOnline} / {server.playersMax}
              </div>
            </div>

            {server.version && (
              <div className="glass border border-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm">Version</span>
                </div>
                <div className="text-2xl font-bold text-white">{server.version}</div>
              </div>
            )}

            <div className="glass border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Server className="h-4 w-4" />
                <span className="text-sm">IP Address</span>
              </div>
              <div className="text-lg font-mono text-blue-400">{server.ipAddress}</div>
            </div>

            {server.port !== 25565 && (
              <div className="glass border border-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Server className="h-4 w-4" />
                  <span className="text-sm">Port</span>
                </div>
                <div className="text-2xl font-bold text-white">{server.port}</div>
              </div>
            )}
          </div>
        </div>

        {/* Online Players */}
        {server.status === 'online' && playerList.length > 0 && (
          <div className="glass border border-blue-500/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-400" />
              Online Players ({playerList.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {playerList.map((player) => (
                <div
                  key={player.uuid}
                  className="flex items-center gap-3 glass border border-white/10 rounded-lg p-3 hover:border-blue-500/30 transition-all"
                >
                  <img
                    src={`https://mc-heads.net/avatar/${player.uuid}/32`}
                    alt={player.name}
                    className="w-8 h-8 rounded"
                  />
                  <span className="text-white font-medium">{player.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Server Address */}
        <div className="glass border border-blue-500/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Connect to Server</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1 glass border border-white/10 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-2">Server Address</div>
              <div className="font-mono text-2xl text-blue-400 font-bold">
                {serverAddress}
              </div>
            </div>
            <CopyButton text={serverAddress} />
          </div>
        </div>

        {/* Bluemap Integration */}
        {server.bluemapUrl && (
          <div className="glass border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Map className="h-6 w-6 text-blue-400" />
                Live Map
              </h2>
              <a
                href={server.bluemapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </a>
            </div>
            <div className="rounded-lg overflow-hidden border border-blue-500/20">
              <iframe
                src={server.bluemapUrl}
                className="w-full h-[600px]"
                title={`${server.name} Bluemap`}
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Modpack Link */}
        {server.curseforgeUrl && (
          <div className="glass border border-orange-500/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Modpack</h2>
            <p className="text-gray-400 mb-4">
              This server requires a modpack to play. Download it from CurseForge:
            </p>
            <a
              href={server.curseforgeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-medium hover-lift glow-orange"
            >
              <ExternalLink className="h-5 w-5" />
              Download Modpack
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function ServerDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto fade-in-up">
      {/* Back Button Skeleton */}
      <div className="mb-6">
        <div className="h-10 w-32 bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Header Skeleton */}
      <div className="glass border border-blue-500/20 rounded-2xl p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 bg-gray-700 rounded-xl animate-pulse" />
          <div className="flex-1">
            <div className="h-12 w-64 bg-gray-700 rounded animate-pulse mb-4" />
            <div className="h-6 w-48 bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-5 w-32 bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-8 w-24 bg-gray-700 rounded-full animate-pulse" />
            <div className="h-6 w-32 bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Server Info Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Server Details Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass border border-blue-500/20 rounded-2xl p-6">
            <div className="h-8 w-40 bg-gray-700 rounded animate-pulse mb-4" />
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-5 w-24 bg-gray-700 rounded animate-pulse" />
                  <div className="h-5 w-32 bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          <div className="glass border border-blue-500/20 rounded-2xl p-6">
            <div className="h-8 w-32 bg-gray-700 rounded animate-pulse mb-4" />
            <div className="h-24 w-full bg-gray-700 rounded animate-pulse" />
          </div>
        </div>

        {/* Player List Skeleton */}
        <div className="glass border border-blue-500/20 rounded-2xl p-6">
          <div className="h-8 w-40 bg-gray-700 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-700 rounded animate-pulse" />
                <div className="h-5 w-24 bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
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
