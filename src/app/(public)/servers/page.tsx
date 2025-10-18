import { Suspense } from 'react';
import { db } from '@/db';
import { servers } from '@/db/schema';
import { desc } from 'drizzle-orm';
import Link from 'next/link';
import { Server, Users, Globe, ExternalLink, Map } from 'lucide-react';
import { cachedExternalFetch } from '@/lib/connection-warmup';

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Servers - Vonix Network',
  description: 'Browse our Minecraft servers and join the community',
};

// Function to fetch live server status from mcstatus.io (no database update)
async function fetchServerStatus(server: any) {
  try {
    const serverAddress = server.port === 25565 ? server.ipAddress : `${server.ipAddress}:${server.port}`;
    const data = await cachedExternalFetch(`https://api.mcstatus.io/v2/status/java/${serverAddress}`);

    return {
      ...server,
      status: data.online ? 'online' : 'offline',
      playersOnline: data.players?.online || 0,
      playersMax: data.players?.max || 0,
      version: data.version?.name_clean || null,
      motd: data.motd?.clean || null,
      icon: data.icon || null,
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
  // Fetch all servers ordered by orderIndex
  const serverListRaw = await db
    .select()
    .from(servers)
    .orderBy(servers.orderIndex, desc(servers.createdAt));

  // Fetch live status for each server
  const serverList = await Promise.all(
    serverListRaw.map(server => fetchServerStatus(server))
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold">
            <span className="gradient-text">Our Servers</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Join one of our Minecraft servers and start your adventure today!
          </p>
        </div>

        {/* Server List */}
        {serverList.length === 0 ? (
          <div className="text-center py-20">
            <Server className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No servers available at the moment</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
            {serverList.map((server) => (
              <Link
                key={server.id}
                href={`/servers/${server.id}`}
                className="group glass border border-blue-500/20 rounded-2xl p-6 hover-lift hover:border-blue-500/40 transition-all"
              >
                {/* Server Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {server.name}
                    </h3>
                    {server.modpackName && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                        <Server className="h-3 w-3" />
                        {server.modpackName}
                      </div>
                    )}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    server.status === 'online'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {server.status === 'online' ? 'Online' : 'Offline'}
                  </div>
                </div>

                {/* Server Stats */}
                <div className="flex items-center gap-6 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">{server.playersOnline} / {server.playersMax}</span>
                  </div>
                  {server.version && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Globe className="h-4 w-4" />
                      <span>{server.version}</span>
                    </div>
                  )}
                  {server.description && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <span className="text-xs">{server.description}</span>
                    </div>
                  )}
                </div>

                {/* Server Address */}
                <div className="glass border border-white/10 rounded-lg p-3 mb-4">
                  <div className="text-xs text-gray-500 mb-1">Server Address</div>
                  <div className="font-mono text-blue-400 text-sm">
                    {server.ipAddress}{server.port !== 25565 ? `:${server.port}` : ''}
                  </div>
                </div>

                {/* Quick Links */}
                {(server.bluemapUrl || server.curseforgeUrl) && (
                  <div className="flex gap-2">
                    {server.bluemapUrl && (
                      <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-sm hover:bg-blue-500/20 transition-colors">
                        <Map className="h-4 w-4" />
                        Bluemap
                      </div>
                    )}
                    {server.curseforgeUrl && (
                      <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-500/10 text-orange-400 rounded-lg text-sm hover:bg-orange-500/20 transition-colors">
                        <ExternalLink className="h-4 w-4" />
                        Modpack
                      </div>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="glass border border-blue-500/20 rounded-2xl p-6 mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">How to Join</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                1
              </div>
              <h3 className="font-semibold text-white">Copy Server Address</h3>
              <p className="text-gray-400 text-sm">
                Click on a server and copy the server address
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                2
              </div>
              <h3 className="font-semibold text-white">Open Minecraft</h3>
              <p className="text-gray-400 text-sm">
                Launch Minecraft and go to Multiplayer
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                3
              </div>
              <h3 className="font-semibold text-white">Add Server & Play</h3>
              <p className="text-gray-400 text-sm">
                Add the server and start playing!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServersSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        {/* Header Skeleton */}
        <div className="text-center space-y-4">
          <div className="h-12 w-64 bg-gray-700 rounded animate-pulse mx-auto" />
          <div className="h-6 w-96 bg-gray-700 rounded animate-pulse mx-auto" />
        </div>

        {/* Server Cards Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass border border-blue-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="h-8 w-48 bg-gray-700 rounded animate-pulse mb-2" />
                  <div className="h-5 w-24 bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="h-6 w-16 bg-gray-700 rounded animate-pulse" />
              </div>

              <div className="flex items-center gap-6 mb-4">
                <div className="h-4 w-20 bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
              </div>

              <div className="h-12 bg-gray-700 rounded animate-pulse mb-4" />

              <div className="flex gap-2">
                <div className="flex-1 h-8 bg-gray-700 rounded animate-pulse" />
                <div className="flex-1 h-8 bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Info Section Skeleton */}
        <div className="glass border border-blue-500/20 rounded-2xl p-6 mt-8">
          <div className="h-7 w-32 bg-gray-700 rounded animate-pulse mb-4" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse mx-auto" />
                <div className="h-5 w-24 bg-gray-700 rounded animate-pulse mx-auto" />
                <div className="h-4 w-32 bg-gray-700 rounded animate-pulse mx-auto" />
              </div>
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
