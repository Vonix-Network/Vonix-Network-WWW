'use client';

import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface RegistrationCode {
  id: number;
  code: string;
  minecraftUsername: string;
  minecraftUuid: string;
  used: boolean;
  userId: number | null;
  expiresAt: Date;
  createdAt: Date;
  usedAt: Date | null;
}

export default function RegistrationCodesPage() {
  const [codes, setCodes] = useState<RegistrationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'used' | 'expired'>('all');

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const res = await fetch('/api/registration/codes');
      if (res.ok) {
        const data = await res.json();
        setCodes(data);
      }
    } catch (error) {
      console.error('Error fetching codes:', error);
      toast.error('Failed to fetch registration codes');
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    const minecraftUsername = prompt('Enter Minecraft username:');
    if (!minecraftUsername) return;

    setGenerating(true);
    try {
      const res = await fetch('/api/registration/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minecraftUsername }),
      });

      if (res.ok) {
        const newCode = await res.json();
        setCodes([newCode, ...codes]);
        toast.success('Registration code generated!');
        
        // Copy to clipboard
        navigator.clipboard.writeText(newCode.code);
        toast.info('Code copied to clipboard');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to generate code');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      toast.error('Failed to generate code');
    } finally {
      setGenerating(false);
    }
  };

  const deleteCode = async (id: number) => {
    if (!confirm('Are you sure you want to delete this code?')) return;

    try {
      const res = await fetch(`/api/registration/codes/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCodes(codes.filter((c) => c.id !== id));
        toast.success('Code deleted');
      } else {
        toast.error('Failed to delete code');
      }
    } catch (error) {
      console.error('Error deleting code:', error);
      toast.error('Failed to delete code');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const filteredCodes = codes.filter((code) => {
    const now = new Date();
    const expired = new Date(code.expiresAt) < now;
    
    switch (filter) {
      case 'active':
        return !code.used && !expired;
      case 'used':
        return code.used;
      case 'expired':
        return expired && !code.used;
      default:
        return true;
    }
  });

  const stats = {
    total: codes.length,
    active: codes.filter((c) => !c.used && new Date(c.expiresAt) > new Date()).length,
    used: codes.filter((c) => c.used).length,
    expired: codes.filter((c) => new Date(c.expiresAt) < new Date() && !c.used).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Registration Codes</h1>
          <p className="text-gray-400 mt-1">
            Manage user registration codes for whitelisted players
          </p>
        </div>
        <button
          onClick={generateCode}
          disabled={generating}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {generating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Generate Code
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Codes</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <Key className="w-10 h-10 text-purple-400" />
          </div>
        </div>
        <div className="bg-gray-800/50 border border-green-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{stats.active}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-800/50 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Used</p>
              <p className="text-3xl font-bold text-blue-400 mt-1">{stats.used}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-800/50 border border-red-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Expired</p>
              <p className="text-3xl font-bold text-red-400 mt-1">{stats.expired}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'active', 'used', 'expired'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === f
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800/50 text-gray-400 hover:text-white'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Codes Table */}
      <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-400" />
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No codes found matching your filter
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-4 text-gray-400 font-semibold">Code</th>
                  <th className="text-left p-4 text-gray-400 font-semibold">Minecraft User</th>
                  <th className="text-left p-4 text-gray-400 font-semibold">Status</th>
                  <th className="text-left p-4 text-gray-400 font-semibold">Expires</th>
                  <th className="text-left p-4 text-gray-400 font-semibold">Created</th>
                  <th className="text-right p-4 text-gray-400 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCodes.map((code) => {
                  const expired = new Date(code.expiresAt) < new Date();
                  return (
                    <tr
                      key={code.id}
                      className="border-b border-gray-800 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="p-4">
                        <code className="bg-gray-900 px-3 py-1 rounded text-purple-400 font-mono text-sm">
                          {code.code}
                        </code>
                      </td>
                      <td className="p-4 text-gray-300">{code.minecraftUsername}</td>
                      <td className="p-4">
                        {code.used ? (
                          <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                            Used
                          </span>
                        ) : expired ? (
                          <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded-full">
                            Expired
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {new Date(code.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {new Date(code.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => copyCode(code.code)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            title="Copy code"
                          >
                            <Copy className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => deleteCode(code.id)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            title="Delete code"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
