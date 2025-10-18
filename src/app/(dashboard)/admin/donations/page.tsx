'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, Trash2, DollarSign, RefreshCw, Edit2, X, Check, Plus } from 'lucide-react';

interface Donation {
  id: number;
  userId: number | null;
  username: string | null;
  minecraftUsername: string | null;
  amount: number;
  currency: string;
  method: string | null;
  message: string | null;
  displayed: boolean;
  createdAt: Date;
}

export default function AdminDonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ message: '', amount: 0 });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    minecraftUsername: '',
    amount: 0,
    currency: 'USD',
    method: '',
    message: '',
    displayed: true,
  });

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const res = await fetch('/api/admin/donations', { cache: 'no-store' });
      const data = await res.json();
      setDonations(data.donations);
    } catch (error) {
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (id: number, displayed: boolean) => {
    try {
      await fetch(`/api/admin/donations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayed: !displayed }),
        cache: 'no-store'
      });
      fetchDonations();
      toast.success('Visibility updated');
    } catch (error) {
      toast.error('Failed to update visibility');
    }
  };

  const startEdit = (donation: Donation) => {
    setEditingId(donation.id);
    setEditForm({ message: donation.message || '', amount: donation.amount });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ message: '', amount: 0 });
  };

  const saveEdit = async (id: number) => {
    try {
      await fetch(`/api/admin/donations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
        cache: 'no-store'
      });
      fetchDonations();
      setEditingId(null);
      toast.success('Donation updated');
    } catch (error) {
      toast.error('Failed to update donation');
    }
  };

  const deleteDonation = async (id: number) => {
    if (!confirm('Delete this donation? This cannot be undone.')) return;
    
    try {
      await fetch(`/api/admin/donations/${id}`, { method: 'DELETE', cache: 'no-store' });
      fetchDonations();
      toast.success('Donation deleted');
    } catch (error) {
      toast.error('Failed to delete donation');
    }
  };

  const createDonation = async () => {
    if (!createForm.minecraftUsername || createForm.amount <= 0) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const res = await fetch('/api/admin/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
        cache: 'no-store'
      });

      if (!res.ok) {
        throw new Error('Failed to create donation');
      }

      fetchDonations();
      setShowCreateForm(false);
      setCreateForm({
        minecraftUsername: '',
        amount: 0,
        currency: 'USD',
        method: '',
        message: '',
        displayed: true,
      });
      toast.success('Donation created successfully');
    } catch (error) {
      toast.error('Failed to create donation');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 text-green-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-400" />
            Donation Management
          </h1>
          <p className="text-gray-400 mt-2">Manage donations and Recent Supporters visibility</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Donation
          </button>
          <button
            onClick={fetchDonations}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Create Donation Form */}
      {showCreateForm && (
        <div className="mb-6 glass border border-green-500/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Add New Donation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Minecraft Username *</label>
              <input
                type="text"
                value={createForm.minecraftUsername}
                onChange={(e) => setCreateForm({ ...createForm, minecraftUsername: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border border-green-500/20 rounded text-white"
                placeholder="PlayerName"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                value={createForm.amount}
                onChange={(e) => setCreateForm({ ...createForm, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-900/50 border border-green-500/20 rounded text-white"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Currency</label>
              <select
                value={createForm.currency}
                onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border border-green-500/20 rounded text-white"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Payment Method</label>
              <input
                type="text"
                value={createForm.method}
                onChange={(e) => setCreateForm({ ...createForm, method: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border border-green-500/20 rounded text-white"
                placeholder="PayPal, Stripe, Crypto, etc."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Message (Optional)</label>
              <textarea
                value={createForm.message}
                onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border border-green-500/20 rounded text-white"
                placeholder="Thank you message..."
                rows={2}
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="displayed"
                checked={createForm.displayed}
                onChange={(e) => setCreateForm({ ...createForm, displayed: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="displayed" className="text-sm text-gray-400">
                Show on public donations page
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={createDonation}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Create Donation
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="glass border border-green-500/20 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-slate-900/50">
          <h2 className="text-xl font-bold text-white">All Donations ({donations.length})</h2>
        </div>

        {donations.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <p>No donations yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {donations.map((donation) => (
              <div
                key={donation.id}
                className={`p-4 hover:bg-white/5 transition-colors ${
                  !donation.displayed ? 'opacity-50' : ''
                }`}
              >
                {editingId === donation.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-400 mb-1">Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.amount}
                          onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-900/50 border border-green-500/20 rounded text-white"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-400 mb-1">Message</label>
                        <input
                          type="text"
                          value={editForm.message}
                          onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-900/50 border border-green-500/20 rounded text-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(donation.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-bold text-green-400">
                          ${donation.amount.toFixed(2)} {donation.currency}
                        </span>
                        {donation.username && (
                          <span className="text-white font-semibold">{donation.username}</span>
                        )}
                        {donation.minecraftUsername && (
                          <span className="text-gray-400 text-sm">({donation.minecraftUsername})</span>
                        )}
                        {donation.method && (
                          <span className="px-2 py-1 bg-slate-800 rounded text-xs text-gray-400">
                            {donation.method}
                          </span>
                        )}
                      </div>
                      {donation.message && (
                        <p className="text-gray-400 italic text-sm">"{donation.message}"</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(donation.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleVisibility(donation.id, donation.displayed)}
                        className={`p-2 rounded transition-colors ${
                          donation.displayed
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                        }`}
                        title={donation.displayed ? 'Hide from public' : 'Show on public page'}
                      >
                        {donation.displayed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => startEdit(donation)}
                        className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded transition-colors"
                        title="Edit donation"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteDonation(donation.id)}
                        className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-colors"
                        title="Delete donation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-300">
          💡 <strong>Tip:</strong> Use the eye icon to toggle visibility on the public donations page. 
          Hidden donations won't appear in "Recent Supporters" but are still stored in the database.
        </p>
      </div>
    </div>
  );
}
