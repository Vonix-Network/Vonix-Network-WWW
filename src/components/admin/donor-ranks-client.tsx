'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Users, Save, X, Crown, Calendar, DollarSign, Eye, Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    color: '#06b6d4',
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
      color: '#06b6d4',
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
        <Card className="border-cyan-500/30 bg-slate-800/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              {editingId ? <Edit className="h-6 w-6 text-purple-400" /> : <Plus className="h-6 w-6 text-cyan-400" />}
              {editingId ? 'Edit' : 'Create'} Donor Rank
            </CardTitle>
            <CardDescription className="text-base">
              Configure the rank settings, pricing, and visual appearance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rank ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Rank ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  disabled={!!editingId}
                  placeholder="vip, vip-plus, mvp"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-gray-500 disabled:opacity-50 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
                <p className="text-xs text-gray-500 mt-2">Lowercase, no spaces (use dashes)</p>
              </div>

              {/* Rank Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Rank Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VIP"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>

              {/* Minimum Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  Monthly Price <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) })}
                  step="0.01"
                  min="0"
                  placeholder="5.00"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
                <p className="text-xs text-gray-500 mt-2">Price per month in USD</p>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  Default Duration
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  min="1"
                  placeholder="30"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
                <p className="text-xs text-gray-500 mt-2">Days per purchase</p>
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Background Color
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-12 w-20 rounded-lg cursor-pointer border-2 border-slate-700"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#06b6d4"
                    className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Text Color */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Text Color
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={formData.textColor}
                    onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                    className="h-12 w-20 rounded-lg cursor-pointer border-2 border-slate-700"
                  />
                  <input
                    type="text"
                    value={formData.textColor}
                    onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                    placeholder="#ffffff"
                    className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Badge Text */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Badge Text
                </label>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="⭐ VIP"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
                <p className="text-xs text-gray-500 mt-2">Displayed next to username</p>
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Icon (Emoji)
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="💎"
                  maxLength={2}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>

              {/* Subtitle */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Supporting the community"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>

              {/* Glow Effect */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.glow}
                      onChange={(e) => setFormData({ ...formData, glow: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-700 bg-slate-900/50 text-cyan-500 focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-yellow-400" />
                      Enable glow effect
                    </span>
                    <p className="text-xs text-gray-500">Adds a subtle glow to the rank text</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Preview */}
            <Card className="mt-6 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5 text-purple-400" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-lg">
                  <span
                    style={{ 
                      color: formData.textColor, 
                      textShadow: formData.glow ? `0 0 10px ${formData.color}` : 'none' 
                    }}
                    className="font-semibold text-lg"
                  >
                    Username
                  </span>
                  {formData.badge && (
                    <span
                      className="px-3 py-1 rounded-md text-sm font-semibold"
                      style={{
                        backgroundColor: `${formData.color}20`,
                        color: formData.textColor,
                        border: `1px solid ${formData.color}40`,
                      }}
                    >
                      {formData.badge}
                    </span>
                  )}
                  {formData.icon && <span className="text-xl">{formData.icon}</span>}
                </div>
                {formData.subtitle && (
                  <p className="text-sm text-gray-400 mt-3 px-4">{formData.subtitle}</p>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              <Button
                onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
                size="lg"
                className="flex-1 h-14 text-base font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              >
                <Save className="h-5 w-5 mr-2" />
                {editingId ? 'Update Rank' : 'Create Rank'}
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
                size="lg"
                className="w-32 h-14 border-slate-600 hover:bg-slate-800"
              >
                <X className="h-5 w-5 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Button */}
      {!isCreating && !editingId && (
        <Button
          onClick={() => setIsCreating(true)}
          size="lg"
          className="w-full h-16 text-base font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create New Donor Rank
        </Button>
      )}

      {/* Ranks Grid */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-2xl">Existing Donor Ranks</CardTitle>
          <CardDescription className="text-base">
            {ranks.length} {ranks.length === 1 ? 'rank' : 'ranks'} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ranks.length === 0 ? (
            <div className="text-center py-16">
              <Crown className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No donor ranks created yet</p>
              <p className="text-gray-500">Create your first rank to get started</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {ranks.map((rank) => (
                <div 
                  key={rank.id}
                  className="p-6 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-cyan-500/30 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Rank Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          style={{ 
                            color: rank.textColor, 
                            textShadow: rank.glow ? `0 0 10px ${rank.color}` : 'none' 
                          }}
                          className="text-2xl font-bold"
                        >
                          {rank.name}
                        </span>
                        {rank.badge && (
                          <span
                            className="px-3 py-1 rounded-md text-sm font-semibold"
                            style={{
                              backgroundColor: `${rank.color}20`,
                              color: rank.textColor,
                              border: `1px solid ${rank.color}40`,
                            }}
                          >
                            {rank.badge}
                          </span>
                        )}
                        {rank.icon && <span className="text-xl">{rank.icon}</span>}
                        {rank.glow && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Glow
                          </Badge>
                        )}
                      </div>

                      {rank.subtitle && (
                        <p className="text-sm text-gray-400 mb-3">{rank.subtitle}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                          <DollarSign className="h-4 w-4 text-green-400" />
                          <span className="font-semibold">${rank.minAmount.toFixed(2)}</span>
                          <span className="text-gray-500">/month</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar className="h-4 w-4 text-blue-400" />
                          <span>{rank.duration} days</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-400" />
                          <span className="font-semibold text-purple-400">{rank.userCount}</span>
                          <span className="text-gray-500">users</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>ID: {rank.id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => startEdit(rank)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(rank.id)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
