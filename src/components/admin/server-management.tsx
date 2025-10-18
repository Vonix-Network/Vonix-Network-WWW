'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Server, Plus, Edit, Trash2, MoreVertical, Globe, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ServerModal } from './server-modal';

interface ServerItem {
  id: number;
  name: string;
  ipAddress: string;
  port: number;
  status: string;
  playersOnline: number;
  playersMax: number;
  version: string | null;
  modpackName: string | null;
  description: string | null;
  bluemapUrl: string | null;
  curseforgeUrl: string | null;
  orderIndex: number;
}

interface ServerManagementProps {
  servers: ServerItem[];
}

export function ServerManagement({ servers: initialServers }: ServerManagementProps) {
  const router = useRouter();
  const [selectedServer, setSelectedServer] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerItem | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

  const handleDropdownToggle = (serverId: number) => {
    if (selectedServer === serverId) {
      setSelectedServer(null);
      setDropdownPosition(null);
    } else {
      const button = buttonRefs.current[serverId];
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4, // Just below the button
          left: rect.left - 180 + rect.width, // Align right edge of dropdown with right edge of button
        });
      }
      setSelectedServer(serverId);
    }
  };

  const handleDeleteServer = async (serverId: number, serverName: string) => {
    if (!confirm(`Are you sure you want to delete "${serverName}"? This action cannot be undone.`)) {
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/admin/servers/${serverId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete server');
      }

      toast.success('Server deleted successfully');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete server');
    } finally {
      setIsUpdating(false);
    }
  };


  return (
    <>
      {showModal && (
        <ServerModal
          server={editingServer}
          onClose={() => {
            setShowModal(false);
            setEditingServer(null);
          }}
        />
      )}

      <div className="glass border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Server className="h-5 w-5 text-green-400" />
            Server Management
          </h2>
          <button
            onClick={() => {
              setEditingServer(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover-lift glow-green"
          >
            <Plus className="h-4 w-4" />
            Add Server
          </button>
        </div>

        <div className="space-y-2">
          {initialServers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No servers yet. Click "Add Server" to create one.
            </div>
          ) : (
            initialServers.map((server) => (
              <div
                key={server.id}
                className="glass border border-white/10 rounded-xl p-4 hover:border-green-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                        <Server className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          {server.name}
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            server.status === 'online'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {server.status}
                          </span>
                          {server.modpackName && (
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                              {server.modpackName}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-3">
                          <span className="font-mono">{server.ipAddress}:{server.port}</span>
                          {server.version && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {server.version}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {server.playersOnline}/{server.playersMax}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      ref={(el) => { buttonRefs.current[server.id] = el; }}
                      onClick={() => handleDropdownToggle(server.id)}
                      disabled={isUpdating}
                      className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Portal-based dropdown */}
      {selectedServer !== null && dropdownPosition && typeof window !== 'undefined' && 
        createPortal(
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-[9998]" 
              onClick={() => {
                setSelectedServer(null);
                setDropdownPosition(null);
              }}
            />
            
            {/* Dropdown Menu */}
            <div 
              className="fixed bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden min-w-[180px] shadow-2xl z-[9999]"
              style={{
                top: dropdownPosition?.top || 0,
                left: dropdownPosition?.left || 0,
              }}
            >
              <button
                onClick={() => {
                  const server = initialServers.find(s => s.id === selectedServer);
                  if (server) {
                    setEditingServer(server);
                    setShowModal(true);
                    setSelectedServer(null);
                    setDropdownPosition(null);
                  }
                }}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 text-blue-400 hover:bg-blue-500/10 transition-colors w-full text-left text-sm"
              >
                <Edit className="h-4 w-4" />
                Edit Server
              </button>
              <button
                onClick={() => {
                  const server = initialServers.find(s => s.id === selectedServer);
                  if (server) {
                    handleDeleteServer(server.id, server.name);
                    setSelectedServer(null);
                    setDropdownPosition(null);
                  }
                }}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors w-full text-left text-sm border-t border-white/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete Server
              </button>
            </div>
          </>,
          document.body
        )
      }
    </>
  );
}
