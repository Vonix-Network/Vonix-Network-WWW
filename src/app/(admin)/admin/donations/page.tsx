'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  Eye, EyeOff, Trash2, DollarSign, RefreshCw, Edit2, X, Check, Plus,
  Download, Search, Filter, TrendingUp, Calendar, ArrowUpDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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

  // Search and Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterVisibility, setFilterVisibility] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchDonations();
  }, []);

  // Analytics Calculations
  const analytics = useMemo(() => {
    const total = donations.reduce((sum, d) => sum + d.amount, 0);
    const last30Days = donations.filter(d => {
      const daysSince = (Date.now() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    });
    const monthlyTotal = last30Days.reduce((sum, d) => sum + d.amount, 0);
    const avgDonation = donations.length > 0 ? total / donations.length : 0;
    const uniqueMethods = new Set(donations.map(d => d.method).filter(Boolean));

    return {
      totalRevenue: total,
      monthlyRevenue: monthlyTotal,
      totalDonations: donations.length,
      avgDonation,
      uniqueMethods: uniqueMethods.size,
      visibleDonations: donations.filter(d => d.displayed).length,
    };
  }, [donations]);

  // Filtered and Sorted Donations
  const filteredDonations = useMemo(() => {
    let filtered = donations;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.minecraftUsername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Method filter
    if (filterMethod !== 'all') {
      filtered = filtered.filter(d => d.method === filterMethod);
    }

    // Visibility filter
    if (filterVisibility === 'visible') {
      filtered = filtered.filter(d => d.displayed);
    } else if (filterVisibility === 'hidden') {
      filtered = filtered.filter(d => !d.displayed);
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
      } else {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
    });

    return filtered;
  }, [donations, searchTerm, filterMethod, filterVisibility, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);
  const paginatedDonations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDonations.slice(start, start + itemsPerPage);
  }, [filteredDonations, currentPage, itemsPerPage]);

  // Get unique payment methods for filter
  const paymentMethods = useMemo(() => {
    const methods = new Set(donations.map(d => d.method).filter(Boolean));
    return Array.from(methods);
  }, [donations]);

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

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Date', 'Username', 'Minecraft', 'Amount', 'Currency', 'Method', 'Message', 'Visible'];
    const rows = filteredDonations.map(d => [
      d.id,
      new Date(d.createdAt).toLocaleString(),
      d.username || 'N/A',
      d.minecraftUsername || 'N/A',
      d.amount.toFixed(2),
      d.currency,
      d.method || 'N/A',
      d.message ? `"${d.message.replace(/"/g, '""')}"` : 'N/A',
      d.displayed ? 'Yes' : 'No'
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Donations exported to CSV');
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
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-400" />
            Donation Management
          </h1>
          <p className="text-gray-400 mt-2">Enterprise analytics and management</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Donation
          </Button>
          <Button onClick={fetchDonations} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              ${analytics.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 30 Days</CardTitle>
            <TrendingUp className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">
              ${analytics.monthlyRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Monthly revenue</p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <Calendar className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {analytics.totalDonations}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {analytics.visibleDonations} visible
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Donation</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">
              ${analytics.avgDonation.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {analytics.uniqueMethods} payment methods
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search donations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="w-full h-10 px-3 bg-slate-900 border border-slate-700 rounded-md text-white text-sm"
              >
                <option value="all">All Methods</option>
                {paymentMethods.map(method => (
                  <option key={method} value={method || 'Unknown'}>{method || 'Unknown'}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterVisibility}
                onChange={(e) => setFilterVisibility(e.target.value)}
                className="w-full h-10 px-3 bg-slate-900 border border-slate-700 rounded-md text-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="visible">Visible Only</option>
                <option value="hidden">Hidden Only</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Sort by:</span>
              <Button
                variant={sortBy === 'date' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('date')}
              >
                <Calendar className="h-3 w-3 mr-1" />
                Date
              </Button>
              <Button
                variant={sortBy === 'amount' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('amount')}
              >
                <DollarSign className="h-3 w-3 mr-1" />
                Amount
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              >
                <ArrowUpDown className="h-3 w-3 mr-1" />
                {sortOrder === 'desc' ? 'Desc' : 'Asc'}
              </Button>
            </div>
            <div className="ml-auto text-sm text-gray-400">
              Showing {paginatedDonations.length} of {filteredDonations.length} donations
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Donation Form */}
      {showCreateForm && (
        <Card className="border-green-500/20">
          <CardHeader>
            <CardTitle>Add New Donation</CardTitle>
            <CardDescription>Create a manual donation entry</CardDescription>
          </CardHeader>
          <CardContent>
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
            <Button onClick={createDonation}>
              <Check className="h-4 w-4 mr-2" />
              Create Donation
            </Button>
            <Button onClick={() => setShowCreateForm(false)} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
          </CardContent>
        </Card>
      )}

      {/* Donations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Donations List</CardTitle>
          <CardDescription>
            {filteredDonations.length} donation{filteredDonations.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
        {paginatedDonations.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <p>No donations found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {paginatedDonations.map((donation) => (
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
            <div className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-300">
            💡 <strong>Tip:</strong> Use search and filters to find specific donations. Export to CSV for external analysis. 
            Hidden donations won't appear in "Recent Supporters" but are still stored in the database.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
