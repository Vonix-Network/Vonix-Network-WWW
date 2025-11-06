'use client';

import { useState, useEffect } from 'react';
import { Server, Plus, Edit, Trash2, Wifi, WifiOff, Users, ExternalLink, Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ServerData {
  id: number;
  name: string;
  description: string | null;
  ipAddress: string;
  port: number;
  modpackName: string | null;
  bluemapUrl: string | null;
  curseforgeUrl: string | null;
  status: string;
  playersOnline: number;
  playersMax: number;
  version: string | null;
  orderIndex: number;
}

interface ServerFormData {
  name: string;
  ipAddress: string;
  port: number;
  description: string;
  modpackName: string;
  bluemapUrl: string;
  curseforgeUrl: string;
  orderIndex: number;
}

export function ServerManagementClient() {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerData | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ServerFormData>({
    name: '',
    ipAddress: '',
    port: 25565,
    description: '',
    modpackName: '',
    bluemapUrl: '',
    curseforgeUrl: '',
    orderIndex: 0,
  });

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      const res = await fetch('/api/admin/servers');
      if (res.ok) {
        const data = await res.json();
        setServers(data);
      }
    } catch (error) {
      console.error('Failed to load servers:', error);
      toast.error('Failed to load servers');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingServer(null);
    setFormData({
      name: '',
      ipAddress: '',
      port: 25565,
      description: '',
      modpackName: '',
      bluemapUrl: '',
      curseforgeUrl: '',
      orderIndex: servers.length,
    });
    setShowForm(true);
  };

  const handleEdit = (server: ServerData) => {
    setEditingServer(server);
    setFormData({
      name: server.name,
      ipAddress: server.ipAddress,
      port: server.port,
      description: server.description || '',
      modpackName: server.modpackName || '',
      bluemapUrl: server.bluemapUrl || '',
      curseforgeUrl: server.curseforgeUrl || '',
      orderIndex: server.orderIndex,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.ipAddress.trim()) {
      toast.error('Name and IP address are required');
      return;
    }

    setSaving(true);
    try {
      const url = editingServer
        ? `/api/admin/servers/${editingServer.id}`
        : '/api/admin/servers';
      
      const method = editingServer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingServer ? 'Server updated' : 'Server created');
        setShowForm(false);
        loadServers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save server');
      }
    } catch (error) {
      toast.error('Failed to save server');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (server: ServerData) => {
    if (!confirm(`Delete server "${server.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/servers/${server.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Server deleted');
        loadServers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete server');
      }
    } catch (error) {
      toast.error('Failed to delete server');
    }
  };

  const stats = {
    total: servers.length,
    online: servers.filter(s => s.status === 'online').length,
    totalPlayers: servers.reduce((sum, s) => sum + s.playersOnline, 0),
    maxCapacity: servers.reduce((sum, s) => sum + s.playersMax, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <>
      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <p className="text-sm text-gray-400">Capacity</p>
            </div>
            <p className="text-3xl font-bold text-white">{stats.maxCapacity}</p>
          </CardContent>
        </Card>
      </div>

      {/* Server List */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Server List</h2>
            <Button
              onClick={handleAdd}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Server
            </Button>
          </div>

          {servers.length === 0 ? (
            <div className="text-center py-16">
              <Server className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No servers configured</p>
              <p className="text-gray-500 mb-6">Add your first Minecraft server</p>
              <Button onClick={handleAdd} variant="outline" className="border-blue-500/30">
                <Plus className="h-4 w-4 mr-2" />
                Add Server
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {servers.map((server) => (
                <div
                  key={server.id}
                  className="p-6 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-blue-500/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-500/20 p-3 rounded-lg">
                        <Server className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{server.name}</h3>
                        {server.description && (
                          <p className="text-sm text-gray-400">{server.description}</p>
                        )}
                        <p className="text-sm text-gray-500 font-mono mt-1">
                          {server.ipAddress}:{server.port}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {server.status === 'online' ? (
                        <span className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-sm font-semibold">
                          <Wifi className="w-3 h-3" />
                          Online
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-sm font-semibold">
                          <WifiOff className="w-3 h-3" />
                          Offline
                        </span>
                      )}
                      <Button
                        onClick={() => handleEdit(server)}
                        variant="outline"
                        size="sm"
                        className="border-blue-500/30 hover:bg-blue-500/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(server)}
                        variant="outline"
                        size="sm"
                        className="border-red-500/30 hover:bg-red-500/10 text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {server.status === 'online' && server.playersMax > 0 && (
                    <div className="flex items-center gap-6 text-sm text-gray-400 mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-cyan-400" />
                        <span className="font-semibold text-cyan-400">{server.playersOnline}</span>
                        <span>/</span>
                        <span>{server.playersMax}</span>
                      </div>
                      <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden max-w-xs">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                          style={{ width: `${(server.playersOnline / server.playersMax) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {(server.modpackName || server.bluemapUrl || server.curseforgeUrl) && (
                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-700">
                      {server.modpackName && (
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-medium">
                          {server.modpackName}
                        </span>
                      )}
                      {server.bluemapUrl && (
                        <a
                          href={server.bluemapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-medium hover:bg-blue-500/30 transition-colors"
                        >
                          BlueMap <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {server.curseforgeUrl && (
                        <a
                          href={server.curseforgeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-medium hover:bg-orange-500/30 transition-colors"
                        >
                          CurseForge <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="border-slate-700 bg-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">
                  {editingServer ? 'Edit Server' : 'Add Server'}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Server Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Survival"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      IP Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.ipAddress}
                      onChange={(e) => setFormData({...formData, ipAddress: e.target.value})}
                      placeholder="play.example.com"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({...formData, port: parseInt(e.target.value) || 25565})}
                    placeholder="25565"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Main survival server"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Modpack Name
                  </label>
                  <input
                    type="text"
                    value={formData.modpackName}
                    onChange={(e) => setFormData({...formData, modpackName: e.target.value})}
                    placeholder="ATM9"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    BlueMap URL
                  </label>
                  <input
                    type="url"
                    value={formData.bluemapUrl}
                    onChange={(e) => setFormData({...formData, bluemapUrl: e.target.value})}
                    placeholder="https://map.example.com"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    CurseForge URL
                  </label>
                  <input
                    type="url"
                    value={formData.curseforgeUrl}
                    onChange={(e) => setFormData({...formData, curseforgeUrl: e.target.value})}
                    placeholder="https://curseforge.com/modpack"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 h-12"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        {editingServer ? 'Update Server' : 'Create Server'}
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowForm(false)}
                    variant="outline"
                    className="border-slate-600 hover:bg-slate-700"
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
