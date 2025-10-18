'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Bitcoin, Loader2, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DonationSettings {
  paypalEmail: string;
  paypalMeUrl: string;
  solanaAddress: string;
  bitcoinAddress: string;
  ethereumAddress: string;
  litecoinAddress: string;
}

export function DonationSettings() {
  const [settings, setSettings] = useState<DonationSettings>({
    paypalEmail: '',
    paypalMeUrl: '',
    solanaAddress: '',
    bitcoinAddress: '',
    ethereumAddress: '',
    litecoinAddress: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/donations');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading donation settings:', error);
      toast.error('Failed to load donation settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/admin/settings/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      toast.success('Donation settings saved successfully');
    } catch (error) {
      console.error('Error saving donation settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass border border-green-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 text-green-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass border border-green-500/20 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="h-6 w-6 text-green-400" />
        <div>
          <h2 className="text-xl font-bold text-white">Donation Payment Settings</h2>
          <p className="text-sm text-gray-400">Configure payment methods for donations</p>
        </div>
      </div>

      {/* Warning */}
      <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-200">
          <p className="font-semibold mb-1">Security Notice</p>
          <p>These settings are stored securely in the database and displayed publicly on the donations page. Never share private keys or sensitive information.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* PayPal Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-400" />
            PayPal Settings
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              PayPal Email
            </label>
            <input
              type="email"
              value={settings.paypalEmail}
              onChange={(e) => setSettings({ ...settings, paypalEmail: e.target.value })}
              placeholder="donations@vonix-network.com"
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-green-500/50 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Email address for PayPal donations</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              PayPal.me URL
            </label>
            <input
              type="url"
              value={settings.paypalMeUrl}
              onChange={(e) => setSettings({ ...settings, paypalMeUrl: e.target.value })}
              placeholder="https://paypal.me/vonixnetwork"
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-green-500/50 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Your PayPal.me link for quick donations</p>
          </div>
        </div>

        {/* Cryptocurrency Section */}
        <div className="space-y-4 pt-6 border-t border-white/10">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Bitcoin className="h-5 w-5 text-orange-400" />
            Cryptocurrency Addresses
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bitcoin Address
            </label>
            <input
              type="text"
              value={settings.bitcoinAddress}
              onChange={(e) => setSettings({ ...settings, bitcoinAddress: e.target.value })}
              placeholder="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-green-500/50 focus:outline-none font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ethereum Address
            </label>
            <input
              type="text"
              value={settings.ethereumAddress}
              onChange={(e) => setSettings({ ...settings, ethereumAddress: e.target.value })}
              placeholder="0x..."
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-green-500/50 focus:outline-none font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Litecoin Address
            </label>
            <input
              type="text"
              value={settings.litecoinAddress}
              onChange={(e) => setSettings({ ...settings, litecoinAddress: e.target.value })}
              placeholder="ltc1..."
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-green-500/50 focus:outline-none font-mono text-sm"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
