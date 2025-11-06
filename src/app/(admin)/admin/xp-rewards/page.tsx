'use client';

import { useState, useEffect } from 'react';
import { Award, Plus, Edit2, Trash2, Save, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getXPForLevel, getTotalXPForLevel } from '@/lib/xp-utils';

interface LevelReward {
  id: number;
  level: number;
  title: string | null;
  badge: string | null;
  description: string | null;
  rewardType: string | null;
  rewardValue: string | null;
  createdAt: Date;
}

export default function XPRewardsPage() {
  const [rewards, setRewards] = useState<LevelReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    level: '',
    title: '',
    badge: '',
    description: '',
    rewardType: 'title',
    rewardValue: '',
  });

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const res = await fetch('/api/xp/rewards');
      if (res.ok) {
        const data = await res.json();
        setRewards(data);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.level) {
      toast.error('Level is required');
      return;
    }

    try {
      const res = await fetch('/api/xp/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: parseInt(formData.level),
          title: formData.title || null,
          badge: formData.badge || null,
          description: formData.description || null,
          rewardType: formData.rewardType || null,
          rewardValue: formData.rewardValue || null,
        }),
      });

      if (res.ok) {
        const newReward = await res.json();
        setRewards([...rewards, newReward].sort((a, b) => a.level - b.level));
        setShowCreate(false);
        setFormData({
          level: '',
          title: '',
          badge: '',
          description: '',
          rewardType: 'title',
          rewardValue: '',
        });
        toast.success('Level reward created!');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to create reward');
      }
    } catch (error) {
      console.error('Error creating reward:', error);
      toast.error('Failed to create reward');
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      const res = await fetch(`/api/xp/rewards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const updated = await res.json();
        setRewards(rewards.map((r) => (r.id === id ? updated : r)));
        setEditingId(null);
        toast.success('Reward updated!');
      } else {
        toast.error('Failed to update reward');
      }
    } catch (error) {
      console.error('Error updating reward:', error);
      toast.error('Failed to update reward');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this reward?')) return;

    try {
      const res = await fetch(`/api/xp/rewards/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setRewards(rewards.filter((r) => r.id !== id));
        toast.success('Reward deleted');
      } else {
        toast.error('Failed to delete reward');
      }
    } catch (error) {
      console.error('Error deleting reward:', error);
      toast.error('Failed to delete reward');
    }
  };

  const startEdit = (reward: LevelReward) => {
    setEditingId(reward.id);
    setFormData({
      level: reward.level.toString(),
      title: reward.title || '',
      badge: reward.badge || '',
      description: reward.description || '',
      rewardType: reward.rewardType || 'title',
      rewardValue: reward.rewardValue || '',
    });
  };

  const handleSyncLevels = async () => {
    if (!confirm('This will recalculate ALL user levels based on their current XP and the new formula. Continue?')) {
      return;
    }

    setSyncing(true);
    try {
      const res = await fetch('/api/admin/sync-levels', {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Synced ${data.updatedCount} user levels!`);
        if (data.updates && data.updates.length > 0) {
          console.log('Sample updates:', data.updates);
        }
      } else {
        toast.error('Failed to sync levels');
      }
    } catch (error) {
      console.error('Error syncing levels:', error);
      toast.error('Failed to sync levels');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Level Rewards</h1>
          <p className="text-gray-400 mt-1">
            Configure rewards that users receive when reaching specific levels
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSyncLevels}
            disabled={syncing}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all flex items-center gap-2 disabled:opacity-50"
            title="Recalculate all user levels based on new XP formula"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync All Levels'}
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2"
          >
            {showCreate ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showCreate ? 'Cancel' : 'Add Reward'}
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Create Level Reward</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Level *
              </label>
              <input
                type="number"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                placeholder="e.g., 10"
                min="1"
              />
              {formData.level && (
                <p className="text-xs text-gray-500 mt-1">
                  Requires {getTotalXPForLevel(parseInt(formData.level)).toLocaleString()} total XP
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                placeholder="e.g., Warrior"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Badge (Emoji)
              </label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                placeholder="e.g., ⚔️"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Reward Type
              </label>
              <select
                value={formData.rewardType}
                onChange={(e) => setFormData({ ...formData, rewardType: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
              >
                <option value="title">Title</option>
                <option value="badge">Badge</option>
                <option value="feature">Feature</option>
                <option value="currency">Currency</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                placeholder="Describe the reward..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Create Reward
            </button>
          </div>
        </div>
      )}

      {/* Rewards List */}
      <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : rewards.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No level rewards configured yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-4 text-gray-400 font-semibold">Level</th>
                  <th className="text-left p-4 text-gray-400 font-semibold">Total XP Req.</th>
                  <th className="text-left p-4 text-gray-400 font-semibold">Title</th>
                  <th className="text-left p-4 text-gray-400 font-semibold">Badge</th>
                  <th className="text-left p-4 text-gray-400 font-semibold">Description</th>
                  <th className="text-right p-4 text-gray-400 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rewards.map((reward) => {
                  const isEditing = editingId === reward.id;
                  
                  if (isEditing) {
                    return (
                      <tr key={reward.id} className="border-b border-gray-800 bg-purple-500/10">
                        <td className="p-4" colSpan={6}>
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Edit2 className="w-5 h-5 text-purple-400" />
                              <h3 className="text-lg font-bold text-purple-400">
                                Editing Level {reward.level} Reward
                              </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-2">
                                  Title
                                </label>
                                <input
                                  type="text"
                                  value={formData.title}
                                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-2">
                                  Badge (Emoji)
                                </label>
                                <input
                                  type="text"
                                  value={formData.badge}
                                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-400 mb-2">
                                  Description
                                </label>
                                <textarea
                                  value={formData.description}
                                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                                  rows={2}
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                              <button
                                onClick={() => handleUpdate(reward.id)}
                                className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                              >
                                <Save className="w-4 h-4" />
                                Save Changes
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={reward.id}
                      className="border-b border-gray-800 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="p-4">
                        <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full font-bold">
                          {reward.level}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {getTotalXPForLevel(reward.level).toLocaleString()} XP
                      </td>
                      <td className="p-4 text-gray-300">{reward.title || '-'}</td>
                      <td className="p-4 text-2xl">{reward.badge || '-'}</td>
                      <td className="p-4 text-gray-400 text-sm max-w-xs truncate">
                        {reward.description || '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(reward)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(reward.id)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            title="Delete"
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
