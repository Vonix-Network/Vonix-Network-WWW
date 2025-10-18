'use client';

import { useState } from 'react';
import { DiscordSettings } from './discord-settings';
import { DonationSettings } from './donation-settings';
import { 
  MessageCircle, 
  Globe, 
  Shield, 
  Bell, 
  Palette,
  Database,
  Mail,
  Zap,
  DollarSign
} from 'lucide-react';

type SettingsSection = 'discord' | 'donations' | 'general' | 'security' | 'notifications' | 'appearance' | 'database' | 'email' | 'integrations';

export function SettingsPageClient() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('discord');

  const sections = [
    {
      id: 'discord' as SettingsSection,
      name: 'Discord Integration',
      icon: <MessageCircle className="h-5 w-5" />,
      description: 'Configure Discord bot and chat integration',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      id: 'donations' as SettingsSection,
      name: 'Donations',
      icon: <DollarSign className="h-5 w-5" />,
      description: 'Payment methods and donation settings',
      color: 'text-green-400 bg-green-500/10 border-blue-500/20',
    },
    {
      id: 'general' as SettingsSection,
      name: 'General',
      icon: <Globe className="h-5 w-5" />,
      description: 'Site name, description, and basic settings',
      color: 'text-green-400 bg-green-500/10 border-blue-500/20',
    },
    {
      id: 'security' as SettingsSection,
      name: 'Security',
      icon: <Shield className="h-5 w-5" />,
      description: 'Authentication, API keys, and security settings',
      color: 'text-red-400 bg-red-500/10 border-red-500/20',
    },
    {
      id: 'notifications' as SettingsSection,
      name: 'Notifications',
      icon: <Bell className="h-5 w-5" />,
      description: 'Configure notification preferences',
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    },
    {
      id: 'appearance' as SettingsSection,
      name: 'Appearance',
      icon: <Palette className="h-5 w-5" />,
      description: 'Theme colors, branding, and UI customization',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      id: 'database' as SettingsSection,
      name: 'Database',
      icon: <Database className="h-5 w-5" />,
      description: 'Database connection and maintenance',
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      id: 'email' as SettingsSection,
      name: 'Email',
      icon: <Mail className="h-5 w-5" />,
      description: 'SMTP configuration and email templates',
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    },
    {
      id: 'integrations' as SettingsSection,
      name: 'Integrations',
      icon: <Zap className="h-5 w-5" />,
      description: 'Third-party integrations and webhooks',
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    },
  ];

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      {/* Sidebar Navigation */}
      <div className="lg:col-span-1">
        <div className="glass border border-blue-500/20 rounded-2xl p-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
            Settings Sections
          </h2>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full text-left px-3 py-3 rounded-lg transition-all ${
                activeSection === section.id
                  ? 'bg-green-500/20 border border-green-500/30'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${section.color}`}>
                  {section.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${
                    activeSection === section.id ? 'text-green-400' : 'text-white'
                  }`}>
                    {section.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {section.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="lg:col-span-3">
        {activeSection === 'discord' && <DiscordSettings />}
        {activeSection === 'donations' && <DonationSettings />}
        {activeSection === 'general' && <GeneralSettings />}
        {activeSection === 'security' && <SecuritySettings />}
        {activeSection === 'notifications' && <NotificationSettings />}
        {activeSection === 'appearance' && <AppearanceSettings />}
        {activeSection === 'database' && <DatabaseSettings />}
        {activeSection === 'email' && <EmailSettings />}
        {activeSection === 'integrations' && <IntegrationsSettings />}
      </div>
    </div>
  );
}

function GeneralSettings() {
  return (
    <div className="glass border border-blue-500/20 rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6">
        <span className="gradient-text">General Settings</span>
      </h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Site Name</label>
          <input
            type="text"
            defaultValue="Vonix Network"
            className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Site Description</label>
          <textarea
            rows={3}
            defaultValue="A comprehensive Minecraft community platform"
            className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Server IP</label>
          <input
            type="text"
            placeholder="play.vonixnetwork.com"
            className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover-lift glow-gradient">
          Save Changes
        </button>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="glass border border-blue-500/20 rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6">
        <span className="gradient-text">Security Settings</span>
      </h2>
      <div className="space-y-6">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-300">
            <strong>⚠️ Important:</strong> Security settings are managed through environment variables and API key management.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-white mb-3">JWT Configuration</h3>
          <p className="text-sm text-gray-400 mb-2">JWT_SECRET is configured in .env file</p>
          <code className="block px-4 py-2 bg-slate-900/50 rounded text-green-400 text-sm">
            JWT_SECRET=your_secret_key_here
          </code>
        </div>
        <div>
          <h3 className="font-semibold text-white mb-3">API Keys</h3>
          <p className="text-sm text-gray-400 mb-2">Manage API keys in the API Keys section</p>
          <a href="/admin/api-keys" className="text-green-400 hover:text-green-300 text-sm underline">
            Go to API Keys →
          </a>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="glass border border-blue-500/20 rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6">
        <span className="gradient-text">Notification Settings</span>
      </h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
          <div>
            <h3 className="font-medium text-white">Email Notifications</h3>
            <p className="text-sm text-gray-400">Send email notifications for important events</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
          <div>
            <h3 className="font-medium text-white">Discord Notifications</h3>
            <p className="text-sm text-gray-400">Send Discord webhooks for admin alerts</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
          <div>
            <h3 className="font-medium text-white">Push Notifications</h3>
            <p className="text-sm text-gray-400">Browser push notifications for real-time updates</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>
      </div>
    </div>
  );
}

function AppearanceSettings() {
  return (
    <div className="glass border border-blue-500/20 rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6">
        <span className="gradient-text">Appearance Settings</span>
      </h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Primary Color</label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              defaultValue="#3b82f6"
              className="h-12 w-20 rounded-lg cursor-pointer"
            />
            <span className="text-gray-400 text-sm">Current: Emerald (#3b82f6)</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Logo URL</label>
          <input
            type="text"
            placeholder="https://example.com/logo.png"
            className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Favicon URL</label>
          <input
            type="text"
            placeholder="https://example.com/favicon.ico"
            className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover-lift glow-gradient">
          Save Appearance
        </button>
      </div>
    </div>
  );
}

function DatabaseSettings() {
  return (
    <div className="glass border border-blue-500/20 rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6">
        <span className="gradient-text">Database Settings</span>
      </h2>
      <div className="space-y-6">
        <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
          <p className="text-sm text-cyan-300">
            <strong>ℹ️ Info:</strong> Database connection is configured through environment variables (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN).
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-white mb-3">Database Tools</h3>
          <div className="space-y-2">
            <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-left">
              🔄 Run Migrations
            </button>
            <button className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-left">
              📊 Open Drizzle Studio
            </button>
            <button className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors text-left">
              🗑️ Clear Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailSettings() {
  return (
    <div className="glass border border-blue-500/20 rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6">
        <span className="gradient-text">Email Settings</span>
      </h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">SMTP Host</label>
          <input
            type="text"
            placeholder="smtp.gmail.com"
            className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">SMTP Port</label>
            <input
              type="number"
              placeholder="587"
              className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Encryption</label>
            <select className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              <option>TLS</option>
              <option>SSL</option>
              <option>None</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
          <input
            type="text"
            placeholder="your-email@gmail.com"
            className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover-lift glow-gradient">
          Save Email Settings
        </button>
      </div>
    </div>
  );
}

function IntegrationsSettings() {
  return (
    <div className="glass border border-blue-500/20 rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6">
        <span className="gradient-text">Integrations</span>
      </h2>
      <div className="space-y-4">
        <div className="p-4 bg-slate-900/50 border border-blue-500/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-white">Discord Integration</h3>
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Active</span>
          </div>
          <p className="text-sm text-gray-400 mb-3">Real-time chat integration with Discord</p>
          <a href="#" onClick={() => {}} className="text-green-400 hover:text-green-300 text-sm underline">
            Configure →
          </a>
        </div>
        <div className="p-4 bg-slate-900/50 border border-gray-500/20 rounded-lg opacity-60">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-white">Stripe Payments</h3>
            <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">Coming Soon</span>
          </div>
          <p className="text-sm text-gray-400">Accept donations and payments</p>
        </div>
        <div className="p-4 bg-slate-900/50 border border-gray-500/20 rounded-lg opacity-60">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-white">Google Analytics</h3>
            <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">Coming Soon</span>
          </div>
          <p className="text-sm text-gray-400">Track visitor analytics</p>
        </div>
      </div>
    </div>
  );
}
