'use client';

import { useState, useEffect } from 'react';
import { Play, Square, RotateCw, Loader2, CheckCircle, XCircle, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface BotStatus {
  connected: boolean;
  username: string | null;
  channelId: string;
  hasToken: boolean;
  hasWebhook: boolean;
}

interface DiscordConfig {
  channelId: string;
  hasToken: boolean;
  hasWebhook: boolean;
  tokenPreview: string | null;
  webhookPreview: string | null;
}

export function DiscordSettings() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [config, setConfig] = useState<DiscordConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [controlling, setControlling] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  
  const [configForm, setConfigForm] = useState({
    token: '',
    channelId: '',
    webhookUrl: '',
  });

  const [inviteUrl, setInviteUrl] = useState('https://discord.gg/C7xmVgQnK5');
  const [savingInvite, setSavingInvite] = useState(false);

  useEffect(() => {
    // Load Discord invite URL
    fetch('/api/admin/settings/discord')
      .then(res => res.json())
      .then(data => setInviteUrl(data.inviteUrl || 'https://discord.gg/C7xmVgQnK5'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadStatus();
    loadConfig();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/admin/discord/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error loading Discord status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/discord/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setConfigForm({
          token: '',
          channelId: data.channelId || '',
          webhookUrl: '',
        });
      }
    } catch (error) {
      console.error('Error loading Discord config:', error);
    }
  };

  const handleControl = async (action: 'start' | 'stop' | 'restart') => {
    setControlling(true);
    try {
      const response = await fetch('/api/admin/discord/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} bot`);
      }

      toast.success(data.message);
      await loadStatus();
    } catch (error) {
      console.error(`Error ${action}ing bot:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${action} bot`);
    } finally {
      setControlling(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setControlling(true);

    try {
      const updates: any = {};
      
      if (configForm.token) updates.token = configForm.token;
      if (configForm.channelId) updates.channelId = configForm.channelId;
      if (configForm.webhookUrl) updates.webhookUrl = configForm.webhookUrl;

      if (Object.keys(updates).length === 0) {
        toast.error('No changes to save');
        return;
      }

      const response = await fetch('/api/admin/discord/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save configuration');
      }

      toast.success(data.message);
      await loadConfig();
      await loadStatus();
      
      // Clear form
      setConfigForm({
        token: '',
        channelId: data.config.channelId,
        webhookUrl: '',
      });
      
      setShowConfig(false);
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setControlling(false);
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

  const handleSaveInviteUrl = async () => {
    setSavingInvite(true);
    try {
      const res = await fetch('/api/admin/settings/discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteUrl }),
      });
      if (res.ok) {
        toast.success('Discord invite URL saved!');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save');
      }
    } finally {
      setSavingInvite(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Discord Invite URL Card */}
      <div className="glass border border-purple-500/20 rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-6">
          <span className="gradient-text">Discord Invite Link</span>
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Discord Invite URL
            </label>
            <input
              type="url"
              value={inviteUrl}
              onChange={(e) => setInviteUrl(e.target.value)}
              placeholder="https://discord.gg/C7xmVgQnK5"
              className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <p className="text-xs text-gray-500 mt-1">
              This link will be shown in the chat widget and other Discord integrations
            </p>
          </div>
          <button
            onClick={handleSaveInviteUrl}
            disabled={savingInvite}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover-lift glow-purple disabled:opacity-50"
          >
            {savingInvite ? 'Saving...' : 'Save Invite URL'}
          </button>
        </div>
      </div>

      {/* Status Card */}
      <div className="glass border border-green-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            <span className="gradient-text">Discord Bot Status</span>
          </h2>
          <button
            onClick={() => loadStatus()}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            disabled={controlling}
          >
            <RotateCw className={`h-5 w-5 ${controlling ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-slate-900/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Connection Status</span>
              {status?.connected ? (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span>Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle className="h-5 w-5" />
                  <span>Disconnected</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-900/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Bot Username</span>
              <span className="text-white font-mono">{status?.username || 'N/A'}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Channel ID</span>
              <span className="text-white font-mono text-sm">{status?.channelId || 'Not set'}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Configuration</span>
              <div className="flex gap-2 text-xs">
                {status?.hasToken ? (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">Token ✓</span>
                ) : (
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">Token ✗</span>
                )}
                {status?.hasWebhook ? (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">Webhook ✓</span>
                ) : (
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">Webhook ✗</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bot Process Info */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-300">
            💡 <strong>Note:</strong> The Discord bot runs as a separate process. Use <code className="px-2 py-1 bg-slate-900/50 rounded text-blue-400">npm run bot</code> in a terminal to start it.
          </p>
        </div>
      </div>

      {/* Configuration Card */}
      <div className="glass border border-green-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            <span className="gradient-text">Discord Configuration</span>
          </h2>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Settings className="h-4 w-4" />
            {showConfig ? 'Hide' : 'Edit'} Config
          </button>
        </div>

        {showConfig ? (
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bot Token
              </label>
              <input
                type="password"
                value={configForm.token}
                onChange={(e) => setConfigForm({ ...configForm, token: e.target.value })}
                placeholder="Enter new bot token (leave empty to keep current)"
                className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
              {config?.tokenPreview && (
                <p className="text-xs text-gray-500 mt-1">Current: {config.tokenPreview}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Channel ID
              </label>
              <input
                type="text"
                value={configForm.channelId}
                onChange={(e) => setConfigForm({ ...configForm, channelId: e.target.value })}
                placeholder="Enter Discord channel ID"
                className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Webhook URL
              </label>
              <input
                type="text"
                value={configForm.webhookUrl}
                onChange={(e) => setConfigForm({ ...configForm, webhookUrl: e.target.value })}
                placeholder="Enter new webhook URL (leave empty to keep current)"
                className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
              {config?.webhookPreview && (
                <p className="text-xs text-gray-500 mt-1">Current: {config.webhookPreview}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                disabled={controlling}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={controlling}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover-lift glow-green disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {controlling ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-300">
                ⚠️ <strong>Note:</strong> After changing configuration, restart the bot for changes to take effect.
              </p>
            </div>
          </form>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-gray-400">Bot Token:</span>
              <span className="text-white">{config?.hasToken ? '✓ Configured' : '✗ Not set'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-gray-400">Channel ID:</span>
              <span className="text-white font-mono text-xs">{config?.channelId || 'Not set'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Webhook URL:</span>
              <span className="text-white">{config?.hasWebhook ? '✓ Configured' : '✗ Not set'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Help Card */}
      <div className="glass border border-blue-500/20 rounded-2xl p-6 bg-blue-500/5">
        <h3 className="text-lg font-semibold text-white mb-3">📚 Setup Guide</h3>
        <div className="space-y-3 text-sm text-gray-300">
          <div>
            <p className="font-semibold text-white mb-1">1. Install Dependencies</p>
            <code className="block px-3 py-2 bg-slate-900/50 rounded text-green-400">npm install</code>
          </div>
          <div>
            <p className="font-semibold text-white mb-1">2. Create Discord Bot</p>
            <p>• Go to <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Discord Developer Portal</a></p>
            <p>• Create a new application and add a bot</p>
            <p>• Enable <strong>Message Content Intent</strong> in Bot settings</p>
            <p>• Copy the bot token</p>
          </div>
          <div>
            <p className="font-semibold text-white mb-1">3. Get Channel ID & Webhook</p>
            <p>• Enable Developer Mode in Discord settings</p>
            <p>• Right-click your channel → Copy ID</p>
            <p>• In channel settings → Integrations → Webhooks → Create webhook</p>
            <p>• Copy the webhook URL</p>
          </div>
          <div>
            <p className="font-semibold text-white mb-1">4. Configure Above</p>
            <p>• Click "Edit Config" and paste your bot token, channel ID, and webhook URL</p>
            <p>• Save the configuration</p>
          </div>
          <div>
            <p className="font-semibold text-white mb-1">5. Start the Bot</p>
            <p>• Open a terminal in your project directory</p>
            <code className="block px-3 py-2 bg-slate-900/50 rounded text-green-400 mt-1">npm run bot</code>
            <p className="mt-1 text-gray-400">Keep this terminal running. The bot will listen for Discord messages and sync them to your website.</p>
          </div>
          <div>
            <p className="font-semibold text-white mb-1">6. Start Next.js (separate terminal)</p>
            <code className="block px-3 py-2 bg-slate-900/50 rounded text-green-400">npm run dev</code>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-blue-500/20">
          <p className="text-xs text-gray-400">
            💡 <strong>Tip:</strong> You can use a process manager like <code className="text-blue-400">pm2</code> to keep the bot running in production.
          </p>
        </div>
      </div>
    </div>
  );
}