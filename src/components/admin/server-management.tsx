'use client';

import { useState, useEffect } from 'react';
import { 
  Server, 
  Users, 
  Globe, 
  Activity, 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Square, 
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { formatServerAddress, type ServerStatus } from '@/lib/server-utils';

interface ServerData {
  id: number;
  name: string;
  ipAddress: string;
  port: number;
  description?: string;
  modpackName?: string;
  bluemapUrl?: string;
  curseforgeUrl?: string;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ServerWithStatus extends ServerData {
  status?: ServerStatus;
}

export default function ServerManagement() {
  const [servers, setServers] = useState<ServerWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedServer, setSelectedServer] = useState<ServerWithStatus | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch servers from database
  const fetchServers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/servers');
      if (!response.ok) throw new Error('Failed to fetch servers');
      const serverData = await response.json();
      setServers(serverData);
    } catch (error) {
      console.error('Error fetching servers:', error);
      toast.error('Failed to fetch servers');
    } finally {
      setLoading(false);
    }
  };

  // Fetch server statuses
  const fetchServerStatuses = async () => {
    if (servers.length === 0) return;
    
    setRefreshing(true);
    try {
      const serverAddresses = servers.map(server => 
        formatServerAddress(server.ipAddress, server.port)
      );
      
      const response = await fetch('/api/admin/servers/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servers: serverAddresses }),
      });
      
      if (!response.ok) throw new Error('Failed to fetch server statuses');
      
      const statuses: ServerStatus[] = await response.json();
      
      // Update servers with status data
      setServers(prevServers => 
        prevServers.map(server => {
          const serverAddress = formatServerAddress(server.ipAddress, server.port);
          const status = statuses.find(s => s.server === serverAddress);
          return { ...server, status };
        })
      );
    } catch (error) {
      console.error('Error fetching server statuses:', error);
      toast.error('Failed to fetch server statuses');
    } finally {
      setRefreshing(false);
    }
  };

  // Delete server
  const deleteServer = async (serverId: number) => {
    if (!confirm('Are you sure you want to delete this server?')) return;

    try {
      const response = await fetch(`/api/admin/servers/${serverId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete server');

      toast.success('Server deleted successfully');
      fetchServers();
    } catch (error) {
      console.error('Error deleting server:', error);
      toast.error('Failed to delete server');
    }
  };

  // Auto-refresh statuses every 30 seconds
  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    if (servers.length > 0) {
      fetchServerStatuses();
      
      const interval = setInterval(fetchServerStatuses, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [servers.length]);

  if (loading) {
    return (
      <div className="glass border border-blue-500/20 rounded-2xl p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
          <span className="ml-2 text-gray-400">Loading servers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Server Management</h2>
          <p className="text-gray-400">Manage your Minecraft servers and monitor their status</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchServerStatuses}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover-lift glow-gradient"
          >
            <Plus className="h-4 w-4" />
            Add Server
          </button>
        </div>
        </div>

      {/* Server List */}
      <div className="glass border border-blue-500/20 rounded-2xl p-6">
        {servers.length === 0 ? (
          <div className="text-center py-12">
            <Server className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No servers configured</h3>
            <p className="text-gray-400 mb-4">Add your first Minecraft server to get started</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover-lift glow-gradient mx-auto"
            >
              <Plus className="h-5 w-5" />
              Add Server
            </button>
            </div>
          ) : (
          <div className="space-y-4">
            {servers.map((server) => (
              <div
                key={server.id}
                className="glass border border-blue-500/10 rounded-xl p-6 hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-white">{server.name}</h3>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        server.status?.online 
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                        {server.status?.online ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        {server.status?.online ? 'Online' : 'Offline'}
                      </div>
                      {server.status?.latency && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">
                          <Clock className="h-3 w-3" />
                          {server.status.latency}ms
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Server className="h-4 w-4" />
                        <span className="text-sm">
                          {server.ipAddress}:{server.port}
                        </span>
                      </div>
                      
                      {server.status?.players && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Users className="h-4 w-4" />
                          <span className="text-sm">
                            {server.status.players.online}/{server.status.players.max} players
                          </span>
                        </div>
                          )}
                      
                      {server.status?.version && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Globe className="h-4 w-4" />
                          <span className="text-sm">{server.status.version}</span>
                        </div>
                      )}
                      
                      {server.status?.lastUpdated && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Activity className="h-4 w-4" />
                          <span className="text-sm">
                            {new Date(server.status.lastUpdated).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {server.description && (
                      <p className="text-gray-300 text-sm mb-3">{server.description}</p>
                    )}

                    {server.status?.motd && (
                      <div className="glass border border-white/10 rounded-lg p-3 mb-3">
                        <div className="text-xs text-gray-500 mb-1">MOTD</div>
                        <div className="text-sm text-gray-300">{server.status.motd}</div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2">
                      {server.bluemapUrl && (
                        <a
                          href={server.bluemapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Bluemap
                        </a>
                      )}
                      
                      {server.curseforgeUrl && (
                        <a
                          href={server.curseforgeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Modpack
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedServer(server);
                        setShowEditModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Edit Server"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => deleteServer(server.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete Server"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {server.status?.error && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>Error: {server.status.error}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          )}
      </div>

      {/* Add Server Modal */}
      {showAddModal && (
        <AddServerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchServers();
          }}
        />
      )}

      {/* Edit Server Modal */}
      {showEditModal && selectedServer && (
        <EditServerModal
          server={selectedServer}
          onClose={() => {
            setShowEditModal(false);
            setSelectedServer(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
                setSelectedServer(null);
            fetchServers();
          }}
        />
      )}
    </div>
  );
}

// Add Server Modal Component
function AddServerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    ipAddress: '',
    port: 25565,
    description: '',
    modpackName: '',
    bluemapUrl: '',
    curseforgeUrl: '',
    orderIndex: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create server');
      
      toast.success('Server created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error creating server:', error);
      toast.error('Failed to create server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass border border-blue-500/20 rounded-2xl p-8 max-w-md w-full mx-4">
        <h3 className="text-2xl font-bold text-white mb-6">Add New Server</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Server Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              placeholder="My Minecraft Server"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                IP Address *
              </label>
              <input
                type="text"
                required
                value={formData.ipAddress}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="play.example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Port
              </label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 25565 })}
                className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="25565"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              placeholder="A brief description of your server"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Modpack Name
            </label>
            <input
              type="text"
              value={formData.modpackName}
              onChange={(e) => setFormData({ ...formData, modpackName: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              placeholder="FTB Skies"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bluemap URL
            </label>
            <input
              type="url"
              value={formData.bluemapUrl}
              onChange={(e) => setFormData({ ...formData, bluemapUrl: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              placeholder="https://map.example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              CurseForge URL
            </label>
            <input
              type="url"
              value={formData.curseforgeUrl}
              onChange={(e) => setFormData({ ...formData, curseforgeUrl: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              placeholder="https://www.curseforge.com/minecraft/modpacks/..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:border-gray-500 hover:text-white transition-colors"
            >
              Cancel
            </button>
              <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover-lift glow-gradient disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Server Modal Component
function EditServerModal({ 
  server, 
  onClose, 
  onSuccess 
}: { 
  server: ServerWithStatus; 
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: server.name,
    ipAddress: server.ipAddress,
    port: server.port,
    description: server.description || '',
    modpackName: server.modpackName || '',
    bluemapUrl: server.bluemapUrl || '',
    curseforgeUrl: server.curseforgeUrl || '',
    orderIndex: server.orderIndex,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/servers/${server.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update server');
      
      toast.success('Server updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating server:', error);
      toast.error('Failed to update server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass border border-blue-500/20 rounded-2xl p-8 max-w-md w-full mx-4">
        <h3 className="text-2xl font-bold text-white mb-6">Edit Server</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Server Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                IP Address *
              </label>
              <input
                type="text"
                required
                value={formData.ipAddress}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Port
              </label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 25565 })}
                className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Modpack Name
            </label>
            <input
              type="text"
              value={formData.modpackName}
              onChange={(e) => setFormData({ ...formData, modpackName: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bluemap URL
            </label>
            <input
              type="url"
              value={formData.bluemapUrl}
              onChange={(e) => setFormData({ ...formData, bluemapUrl: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              CurseForge URL
            </label>
            <input
              type="url"
              value={formData.curseforgeUrl}
              onChange={(e) => setFormData({ ...formData, curseforgeUrl: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:border-gray-500 hover:text-white transition-colors"
            >
              Cancel
              </button>
              <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover-lift glow-gradient disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Server'}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
}