'use client';

import { useState, useEffect } from 'react';
import { X, Server, Globe, Map, ExternalLink, Hash, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ServerModalProps {
  server?: {
    id: number;
    name: string;
    description: string | null;
    ipAddress: string;
    port: number;
    version: string | null;
    modpackName: string | null;
    bluemapUrl: string | null;
    curseforgeUrl: string | null;
    orderIndex: number;
    playersMax: number;
  } | null;
  onClose: () => void;
}

export function ServerModal({ server, onClose }: ServerModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ipAddress: '',
    port: 25565,
    modpackName: '',
    bluemapUrl: '',
    curseforgeUrl: '',
    orderIndex: 0,
  });

  useEffect(() => {
    if (server) {
      setFormData({
        name: server.name,
        description: server.description || '',
        ipAddress: server.ipAddress,
        port: server.port,
        modpackName: server.modpackName || '',
        bluemapUrl: server.bluemapUrl || '',
        curseforgeUrl: server.curseforgeUrl || '',
        orderIndex: server.orderIndex,
      });
    }
  }, [server]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.ipAddress.trim()) {
      toast.error('Name and IP address are required');
      return;
    }

    setIsLoading(true);

    try {
      const url = server 
        ? `/api/admin/servers/${server.id}`
        : '/api/admin/servers';
      
      const method = server ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          ipAddress: formData.ipAddress.trim(),
          port: formData.port,
          modpackName: formData.modpackName.trim() || null,
          bluemapUrl: formData.bluemapUrl.trim() || null,
          curseforgeUrl: formData.curseforgeUrl.trim() || null,
          orderIndex: formData.orderIndex,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save server');
      }

      toast.success(server ? 'Server updated successfully' : 'Server created successfully');
      router.refresh();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass border border-green-500/20 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            <span className="gradient-text">{server ? 'Edit' : 'Add'}</span> Server
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Server Name */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Server className="h-4 w-4 inline mr-2" />
                Server Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Awesome Server"
                required
                className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
              />
            </div>

            {/* IP Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Globe className="h-4 w-4 inline mr-2" />
                IP Address *
              </label>
              <input
                type="text"
                value={formData.ipAddress}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                placeholder="play.example.com"
                required
                className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
              />
            </div>

            {/* Port */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Hash className="h-4 w-4 inline mr-2" />
                Port
              </label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 25565 })}
                placeholder="25565"
                min="1"
                max="65535"
                className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
              />
            </div>

            {/* Info Note */}
            <div className="col-span-2">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-300 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Server version and max players will be automatically fetched from mcstatus.io
                </p>
              </div>
            </div>

            {/* Modpack Name */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Modpack Name
              </label>
              <input
                type="text"
                value={formData.modpackName}
                onChange={(e) => setFormData({ ...formData, modpackName: e.target.value })}
                placeholder="All The Mods 9"
                className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A fun survival server with custom plugins..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all resize-none"
              />
            </div>

            {/* Bluemap URL */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Map className="h-4 w-4 inline mr-2" />
                Bluemap URL
              </label>
              <input
                type="url"
                value={formData.bluemapUrl}
                onChange={(e) => setFormData({ ...formData, bluemapUrl: e.target.value })}
                placeholder="https://map.example.com"
                className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
              />
            </div>

            {/* CurseForge URL */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <ExternalLink className="h-4 w-4 inline mr-2" />
                CurseForge Modpack URL
              </label>
              <input
                type="url"
                value={formData.curseforgeUrl}
                onChange={(e) => setFormData({ ...formData, curseforgeUrl: e.target.value })}
                placeholder="https://www.curseforge.com/minecraft/modpacks/..."
                className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
              />
            </div>

            {/* Order Index */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Order (higher = appears first)
              </label>
              <input
                type="number"
                value={formData.orderIndex}
                onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover-lift glow-green disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : server ? 'Update Server' : 'Create Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
