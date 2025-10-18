'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Eye, EyeOff, Key, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKeyData {
  apiKey: string;
  usage: {
    header: string;
    endpoints: string[];
  };
}

export default function AdminApiKeysPage() {
  const { data: session } = useSession();
  const [apiKeyData, setApiKeyData] = useState<ApiKeyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchApiKey();
    }
  }, [session]);

  const fetchApiKey = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/api-key', {
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        setApiKeyData(data);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to fetch API key');
      }
    } catch (error) {
      console.error('Error fetching API key:', error);
      toast.error('Failed to fetch API key');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  const regenerateApiKey = async () => {
    if (!confirm('Are you sure you want to regenerate the API key? This will invalidate the current key and any integrations using it will need to be updated.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/api-key', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeyData(data);
        toast.success('API key regenerated successfully!');
        setShowKey(true); // Show the new key
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to regenerate API key');
      }
    } catch (error) {
      console.error('Error regenerating API key:', error);
      toast.error('Failed to regenerate API key');
    } finally {
      setLoading(false);
    }
  };

  if (session?.user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
              <p className="text-gray-400">You need admin privileges to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">API Key Management</h1>
          <p className="text-gray-400 mt-2">Manage registration API keys for Minecraft integration</p>
        </div>
        <Button onClick={fetchApiKey} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-green-400" />
              <p className="text-gray-400">Loading API key...</p>
            </div>
          </CardContent>
        </Card>
      ) : !apiKeyData ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-400" />
              <h3 className="text-lg font-semibold text-white mb-2">API Key Not Found</h3>
              <p className="text-gray-400">The REGISTRATION_API_KEY environment variable is not configured.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* API Key Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-green-400" />
                Registration API Key
              </CardTitle>
              <CardDescription>
                Use this key for Minecraft registration endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 glass border border-green-500/20 rounded-lg">
                  <div className="flex-1">
                    <div className="font-mono text-sm text-white bg-gray-800 p-3 rounded border">
                      {showKey ? apiKeyData.apiKey : maskApiKey(apiKeyData.apiKey)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setShowKey(!showKey)}
                      variant="outline"
                      size="sm"
                    >
                      {showKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      onClick={() => copyToClipboard(apiKeyData.apiKey)}
                      variant="outline"
                      size="sm"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-gray-400">
                  <p><strong>Header Name:</strong> <code className="bg-gray-800 px-2 py-1 rounded">{apiKeyData.usage.header}</code></p>
                </div>

                {/* Regenerate Button */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">Regenerate API Key</h4>
                      <p className="text-xs text-gray-400">Generate a new key. This will invalidate the current one.</p>
                    </div>
                    <Button
                      onClick={regenerateApiKey}
                      disabled={loading}
                      variant="outline"
                      className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Regenerate
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Information */}
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>
                Endpoints that require this API key
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {apiKeyData.usage.endpoints.map((endpoint, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 glass border border-green-500/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">POST</Badge>
                      <code className="text-sm text-white">{endpoint}</code>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(endpoint)}
                      variant="ghost"
                      size="sm"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Usage Example */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Example</CardTitle>
              <CardDescription>
                How to use the API key in requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">cURL Example:</h4>
                  <div className="bg-gray-800 p-4 rounded-lg overflow-x-auto">
                    <code className="text-sm text-gray-300 whitespace-pre">
{`curl -X POST ${window.location.origin}/api/registration/generate-code \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${showKey ? apiKeyData.apiKey : '••••••••••••••••'}" \\
  -d '{"minecraftUsername": "PlayerName"}'`}
                    </code>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">JavaScript Example:</h4>
                  <div className="bg-gray-800 p-4 rounded-lg overflow-x-auto">
                    <code className="text-sm text-gray-300 whitespace-pre">
{`fetch('/api/registration/generate-code', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': '${showKey ? apiKeyData.apiKey : '••••••••••••••••'}'
  },
  body: JSON.stringify({
    minecraftUsername: 'PlayerName'
  })
})`}
                    </code>
                  </div>
                </div>

                <Button
                  onClick={() => copyToClipboard(`curl -X POST ${window.location.origin}/api/registration/generate-code -H "Content-Type: application/json" -H "X-API-Key: ${apiKeyData.apiKey}" -d '{"minecraftUsername": "PlayerName"}'`)}
                  variant="outline"
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy cURL Example
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
