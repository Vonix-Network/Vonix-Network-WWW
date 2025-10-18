import { User } from '@/db/schema';
import { useState, useEffect } from 'react';
import { X, Crown, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DonationRank {
  id: string;
  name: string;
  minAmount: number;
  color: string;
  duration: number;
}

interface EditUserRankModalProps {
  user: User;
  ranks: DonationRank[];
  onClose: () => void;
  onSave: (userId: number, data: {
    rankId: string;
    totalDonated: number;
    expiresInDays: number;
  }) => Promise<void>;
}

export function EditUserRankModal({ user, ranks, onClose, onSave }: EditUserRankModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    rankId: user.donationRankId || '',
    totalDonated: user.totalDonated || 0,
    expiresInDays: user.rankExpiresAt 
      ? Math.ceil((new Date(user.rankExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 30
  });

  const selectedRank = ranks.find(r => r.id === formData.rankId);

  useEffect(() => {
    if (selectedRank && formData.expiresInDays < 1) {
      setFormData(prev => ({
        ...prev,
        expiresInDays: selectedRank.duration
      }));
    }
  }, [selectedRank, formData.rankId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.rankId) {
      toast.error('Please select a rank');
      return;
    }

    if (formData.expiresInDays < 1) {
      toast.error('Expiration must be at least 1 day');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(user.id, {
        rankId: formData.rankId,
        totalDonated: formData.totalDonated,
        expiresInDays: formData.expiresInDays
      });
      onClose();
    } catch (error) {
      console.error('Error updating rank:', error);
      toast.error('Failed to update rank');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass border border-green-500/20 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            <span className="gradient-text">Edit User Rank</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Crown className="h-4 w-4 inline mr-2" />
              Donation Rank
            </label>
            <select
              value={formData.rankId}
              onChange={(e) => setFormData({...formData, rankId: e.target.value})}
              className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
              disabled={isLoading}
            >
              <option value="">Select a rank</option>
              {ranks.map((rank) => (
                <option key={rank.id} value={rank.id} style={{ color: rank.color }}>
                  {rank.name} (${rank.minAmount}+)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <DollarSign className="h-4 w-4 inline mr-2" />
              Total Donated
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.totalDonated}
              onChange={(e) => setFormData({...formData, totalDonated: parseFloat(e.target.value) || 0})}
              className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
              placeholder="0.00"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              Expires In (days)
            </label>
            <input
              type="number"
              min="1"
              value={formData.expiresInDays}
              onChange={(e) => setFormData({...formData, expiresInDays: parseInt(e.target.value) || 30})}
              className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
              placeholder="30"
              disabled={isLoading || !formData.rankId}
            />
            {selectedRank && (
              <p className="text-xs text-gray-400 mt-1">
                Default duration: {selectedRank.duration} days
              </p>
            )}
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}