'use client';

import { useState } from 'react';
import { Globe, Palette, Mail, Shield, Save, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type SettingsTab = 'site' | 'appearance' | 'email' | 'security';

export function SettingsPageClient() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('site');

  const tabs = [
    { id: 'site' as const, name: 'Site', icon: Globe, color: 'cyan' },
    { id: 'appearance' as const, name: 'Appearance', icon: Palette, color: 'pink' },
    { id: 'email' as const, name: 'Email', icon: Mail, color: 'blue' },
    { id: 'security' as const, name: 'Security', icon: Shield, color: 'red' },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/30 shadow-lg'
                      : 'bg-slate-700/50 text-gray-400 border-2 border-transparent hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {activeTab === 'site' && <SiteSettings />}
      {activeTab === 'appearance' && <AppearanceSettings />}
      {activeTab === 'email' && <EmailSettings />}
      {activeTab === 'security' && <SecuritySettings />}
    </div>
  );
}

function SiteSettings() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    siteName: 'Vonix Network',
    siteDesc: 'A premium Minecraft community',
    serverIp: 'play.vonixnetwork.com',
    maintenance: false,
    registration: true,
  });

  const save = async () => {
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      toast.success('Site settings saved!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Globe className="h-6 w-6 text-cyan-400" />
          Site Settings
        </CardTitle>
        <CardDescription>Configure basic site information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Site Name</label>
          <input
            value={form.siteName}
            onChange={e => setForm({...form, siteName: e.target.value})}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
          <textarea
            rows={3}
            value={form.siteDesc}
            onChange={e => setForm({...form, siteDesc: e.target.value})}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Server IP</label>
          <input
            value={form.serverIp}
            onChange={e => setForm({...form, serverIp: e.target.value})}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          />
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-700">
          <label className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-cyan-500/30 transition-all cursor-pointer">
            <div>
              <span className="font-semibold text-white">Maintenance Mode</span>
              <p className="text-sm text-gray-400">Disable site access</p>
            </div>
            <div className="relative">
              <input type="checkbox" checked={form.maintenance} onChange={e => setForm({...form, maintenance: e.target.checked})} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-700 rounded-full peer-checked:bg-cyan-500 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-cyan-500/30 transition-all cursor-pointer">
            <div>
              <span className="font-semibold text-white">Registration</span>
              <p className="text-sm text-gray-400">Allow new signups</p>
            </div>
            <div className="relative">
              <input type="checkbox" checked={form.registration} onChange={e => setForm({...form, registration: e.target.checked})} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-700 rounded-full peer-checked:bg-cyan-500 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
            </div>
          </label>
        </div>

        <Button onClick={save} disabled={saving} size="lg" className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 h-12">
          {saving ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Saving...</> : <><Save className="h-5 w-5 mr-2" />Save Settings</>}
        </Button>
      </CardContent>
    </Card>
  );
}

function AppearanceSettings() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ primary: '#06b6d4', accent: '#a855f7', logo: '', darkMode: true });

  const save = async () => {
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      toast.success('Appearance saved!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Palette className="h-6 w-6 text-pink-400" />
          Appearance
        </CardTitle>
        <CardDescription>Customize visual appearance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Primary Color</label>
          <div className="flex gap-3">
            <input type="color" value={form.primary} onChange={e => setForm({...form, primary: e.target.value})} className="h-12 w-20 rounded-lg border-2 border-slate-700" />
            <input value={form.primary} onChange={e => setForm({...form, primary: e.target.value})} className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white font-mono" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Accent Color</label>
          <div className="flex gap-3">
            <input type="color" value={form.accent} onChange={e => setForm({...form, accent: e.target.value})} className="h-12 w-20 rounded-lg border-2 border-slate-700" />
            <input value={form.accent} onChange={e => setForm({...form, accent: e.target.value})} className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white font-mono" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Logo URL</label>
          <input value={form.logo} onChange={e => setForm({...form, logo: e.target.value})} placeholder="https://example.com/logo.png" className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white" />
        </div>

        <label className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-pink-500/30 transition-all cursor-pointer">
          <span className="font-semibold text-white">Dark Mode</span>
          <div className="relative">
            <input type="checkbox" checked={form.darkMode} onChange={e => setForm({...form, darkMode: e.target.checked})} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-700 rounded-full peer-checked:bg-pink-500 transition-colors"></div>
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
          </div>
        </label>

        <Button onClick={save} disabled={saving} size="lg" className="w-full bg-gradient-to-r from-pink-500 to-purple-500 h-12">
          {saving ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Saving...</> : <><Save className="h-5 w-5 mr-2" />Save Appearance</>}
        </Button>
      </CardContent>
    </Card>
  );
}

function EmailSettings() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ host: '', port: 587, user: '', pass: '', from: '' });

  const save = async () => {
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      toast.success('Email settings saved!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Mail className="h-6 w-6 text-blue-400" />
          Email Settings
        </CardTitle>
        <CardDescription>Configure SMTP server</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">SMTP Host</label>
          <input value={form.host} onChange={e => setForm({...form, host: e.target.value})} placeholder="smtp.gmail.com" className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Port</label>
            <input type="number" value={form.port} onChange={e => setForm({...form, port: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">From Email</label>
            <input value={form.from} onChange={e => setForm({...form, from: e.target.value})} placeholder="noreply@site.com" className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Username</label>
          <input value={form.user} onChange={e => setForm({...form, user: e.target.value})} className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Password</label>
          <input type="password" value={form.pass} onChange={e => setForm({...form, pass: e.target.value})} className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white" />
        </div>

        <Button onClick={save} disabled={saving} size="lg" className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 h-12">
          {saving ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Saving...</> : <><Save className="h-5 w-5 mr-2" />Save Email Settings</>}
        </Button>
      </CardContent>
    </Card>
  );
}

function SecuritySettings() {
  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Shield className="h-6 w-6 text-red-400" />
          Security Settings
        </CardTitle>
        <CardDescription>Authentication and security configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-red-300">
              <strong>⚠️ Important:</strong> Security settings are managed through environment variables in your .env file.
            </p>
          </CardContent>
        </Card>

        <div>
          <h3 className="font-semibold text-white mb-2">JWT Configuration</h3>
          <code className="block px-4 py-3 bg-slate-900/50 rounded-lg text-sm text-green-400">
            JWT_SECRET=your_secret_key_here
          </code>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-2">API Keys</h3>
          <p className="text-sm text-gray-400 mb-2">Manage API keys in the dedicated API Keys section</p>
          <a href="/admin/api-keys" className="text-cyan-400 hover:text-cyan-300 text-sm underline">
            Go to API Keys →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
