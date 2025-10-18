'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Users, Save, X } from 'lucide-react';
import { toast } from 'sonner';

// Define types locally to avoid importing database schema on client-side
interface DonationRank {
  id: string;
  name: string;
  minAmount: number;
  color: string;
  textColor: string;
  icon: string | null;
  badge: string | null;
  glow: boolean;
  duration: number;
  subtitle: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DonorRank extends DonationRank {
  userCount: number;
}

interface DonorRanksClientProps {
  initialRanks: DonorRank[];
}

export function DonorRanksClient({ initialRanks }: DonorRanksClientProps) {
  const [ranks, setRanks] = useState(initialRanks);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    minAmount: 0,
    color: '#10b981',
    textColor: '#ffffff',
    icon: '',
    badge: '',
    glow: false,
    duration: 30,
    subtitle: '',
  });

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      minAmount: 0,
      color: '#10b981',
      textColor: '#ffffff',
      icon: '',
      badge: '',
      glow: false,
      duration: 30,
      subtitle: '',
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/admin/donor-ranks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create rank');
      }

      const { rank } = await response.json();
      setRanks([...ranks, { ...rank, userCount: 0 }]);
      toast.success('Donor rank created successfully');
      resetForm();
    } catch (error) {
      console.error('Error creating rank:', error);
      toast.error('Failed to create donor rank');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const response = await fetch('/api/admin/donor-ranks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id }),
      });

      if (!response.ok) {
        throw new Error('Failed to update rank');
      }

      const { rank } = await response.json();
      setRanks(ranks.map(r => r.id === id ? { ...rank, userCount: r.userCount } : r));
      toast.success('Donor rank updated successfully');
      resetForm();
    } catch (error) {
      console.error('Error updating rank:', error);
      toast.error('Failed to update donor rank');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this donor rank? Users with this rank will lose it.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/donor-ranks?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete rank');
      }

      setRanks(ranks.filter(r => r.id !== id));
      toast.success('Donor rank deleted successfully');
    } catch (error) {
      console.error('Error deleting rank:', error);
      toast.error('Failed to delete donor rank');
    }
  };

  const startEdit = (rank: DonorRank) => {
    setFormData({
      id: rank.id,
      name: rank.name,
      minAmount: rank.minAmount,
      color: rank.color,
      textColor: rank.textColor,
      icon: rank.icon || '',
      badge: rank.badge || '',
      glow: rank.glow,
      duration: rank.duration,
      subtitle: rank.subtitle || '',
    });
    setEditingId(rank.id);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="glass border border-green-500/20 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6">
            <span className="gradient-text">{editingId ? 'Edit' : 'Create'} Donor Rank</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Rank ID</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                disabled={!!editingId}
                placeholder="bronze, silver, gold"
                className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Rank Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Bronze Supporter"
                className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Amount ($)</label>
              <input
                type="number"
                value={formData.minAmount}
                onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) })}
                step="0.01"
                className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Duration (days)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-12 w-20 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Text Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.textColor}
                  onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                  className="h-12 w-20 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.textColor}
                  onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                  className="flex-1 px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Badge Text</label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                placeholder="⭐ VIP"
                className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Icon (emoji)</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="💎"
                className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Subtitle</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Supporting the community"
                className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.glow}
                  onChange={(e) => setFormData({ ...formData, glow: e.target.checked })}
                  className="w-5 h-5 rounded border-green-500/20 bg-slate-900/50 text-green-500 focus:ring-2 focus:ring-green-500/50"
                />
                <span className="text-sm font-medium text-gray-300">Enable glow effect</span>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-blue-500/20">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Preview</h3>
            <div className="flex items-center gap-3">
              <span
                style={{ color: formData.textColor, textShadow: formData.glow ? `0 0 10px ${formData.color}` : 'none' }}
                className="font-semibold"
              >
                Username
              </span>
              {formData.badge && (
                <span
                  className="px-2 py-0.5 rounded text-xs font-semibold"
                  style={{
                    backgroundColor: `${formData.color}20`,
                    color: formData.textColor,
                    border: `1px solid ${formData.color}40`,
                  }}
                >
                  {formData.badge}
                </span>
              )}
              {formData.icon && <span>{formData.icon}</span>}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover-lift glow-gradient flex items-center justify-center gap-2"
            >
              <Save className="h-5 w-5" />
              {editingId ? 'Update Rank' : 'Create Rank'}
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <X className="h-5 w-5" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Create Button */}
      {!isCreating && !editingId && (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover-lift glow-green flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Create New Donor Rank
        </button>
      )}

      {/* Ranks List */}
      <div className="glass border border-green-500/20 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold">
            <span className="gradient-text">Existing Donor Ranks</span>
          </h2>
        </div>

        <div className="divide-y divide-white/10">
          {ranks.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              No donor ranks created yet. Create one to get started!
            </div>
          ) : (
            ranks.map((rank) => (
              <div key={rank.id} className="p-6 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        style={{ color: rank.textColor, textShadow: rank.glow ? `0 0 10px ${rank.color}` : 'none' }}
                        className="text-xl font-bold"
                      >
                        {rank.name}
                      </span>
                      {rank.badge && (
                        <span
                          className="px-2 py-0.5 rounded text-xs font-semibold"
                          style={{
                            backgroundColor: `${rank.color}20`,
                            color: rank.textColor,
                            border: `1px solid ${rank.color}40`,
                          }}
                        >
                          {rank.badge}
                        </span>
                      )}
                      {rank.icon && <span className="text-lg">{rank.icon}</span>}
                    </div>
                    <div className="flex gap-4 text-sm text-gray-400">
                      <span>Min: ${rank.minAmount.toFixed(2)}</span>
                      <span>Duration: {rank.duration} days</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {rank.userCount} users
                      </span>
                    </div>
                    {rank.subtitle && (
                      <p className="text-sm text-gray-500 mt-1">{rank.subtitle}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(rank)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(rank.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
