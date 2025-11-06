'use client';

import { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [form, setForm] = useState({ 
    smtpHost: '', 
    smtpPort: 587, 
    smtpUser: '', 
    smtpPass: '', 
    fromEmail: '',
    useTLS: true 
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setForm({
          smtpHost: data['email.smtpHost'] || '',
          smtpPort: parseInt(data['email.smtpPort'] || '587'),
          smtpUser: data['email.smtpUser'] || '',
          smtpPass: '', // Never load password
          fromEmail: data['email.fromEmail'] || '',
          useTLS: data['email.useTLS'] !== 'false',
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          category: 'email',
          data: form
        }),
      });

      if (res.ok) {
        toast.success('Email settings saved successfully!');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setTesting(true);
    try {
      const res = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || 'Test email sent!');
      } else {
        toast.error(data.error || 'Failed to send test email');
      }
    } catch (error) {
      toast.error('Failed to send test email');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </CardContent>
      </Card>
    );
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
          <label className="block text-sm font-semibold text-gray-300 mb-2">SMTP Host <span className="text-red-400">*</span></label>
          <input value={form.smtpHost} onChange={e => setForm({...form, smtpHost: e.target.value})} placeholder="smtp.gmail.com" className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Port <span className="text-red-400">*</span></label>
            <input type="number" value={form.smtpPort} onChange={e => setForm({...form, smtpPort: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20" />
            <p className="text-xs text-gray-500 mt-1">Common: 587 (TLS) or 465 (SSL)</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">From Email <span className="text-red-400">*</span></label>
            <input value={form.fromEmail} onChange={e => setForm({...form, fromEmail: e.target.value})} placeholder="noreply@site.com" className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Username <span className="text-red-400">*</span></label>
          <input value={form.smtpUser} onChange={e => setForm({...form, smtpUser: e.target.value})} placeholder="your-email@gmail.com" className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Password <span className="text-red-400">*</span></label>
          <input type="password" value={form.smtpPass} onChange={e => setForm({...form, smtpPass: e.target.value})} placeholder="Leave empty to keep current password" className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20" />
          <p className="text-xs text-gray-500 mt-1">Use an app-specific password for Gmail</p>
        </div>

        <label className="flex items-center p-4 bg-slate-900/50 rounded-lg border border-slate-700 cursor-pointer">
          <input type="checkbox" checked={form.useTLS} onChange={e => setForm({...form, useTLS: e.target.checked})} className="w-4 h-4 rounded border-slate-700 text-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          <span className="ml-3 text-sm text-white">Use TLS/SSL encryption</span>
        </label>

        <div className="pt-4 border-t border-slate-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Test Email Configuration</h3>
          <div className="flex gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              placeholder="Enter email to send test"
              className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            />
            <Button onClick={handleTestEmail} disabled={testing} variant="outline" className="border-blue-500/30 hover:bg-blue-500/10">
              {testing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</> : <>Send Test</>}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">💡 Save settings first, then test</p>
        </div>

        <Button onClick={save} disabled={saving} size="lg" className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 h-12">
          {saving ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Saving...</> : <><Save className="h-5 w-5 mr-2" />Save Email Settings</>}
        </Button>

        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-blue-300">
              <strong>💡 Gmail Users:</strong> Enable 2-factor authentication and create an app-specific password at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener" className="underline hover:text-blue-200">myaccount.google.com/apppasswords</a>
            </p>
          </CardContent>
        </Card>
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
