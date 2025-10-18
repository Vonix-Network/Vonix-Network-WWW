import Link from 'next/link';
import { Shield, Lock, Eye, Database, UserCheck, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Privacy & Data Protection - Vonix Network',
  description: 'Learn how we protect your data and respect your privacy at Vonix Network',
};

export default function PrivacyPage() {
  return (
    <div>
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-12 w-12 text-green-400" />
            <h1 className="text-5xl font-bold">
              <span className="gradient-text">Privacy & Data Protection</span>
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Your trust is important to us. Learn how we protect your personal information.
          </p>
        </div>

        {/* Quick Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass border border-green-500/20 rounded-xl p-4 text-center">
            <Lock className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <h3 className="font-semibold text-white mb-1">Encrypted</h3>
            <p className="text-sm text-gray-400">All passwords are bcrypt hashed</p>
          </div>
          <div className="glass border border-green-500/20 rounded-xl p-4 text-center">
            <Eye className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <h3 className="font-semibold text-white mb-1">No Tracking</h3>
            <p className="text-sm text-gray-400">We don't sell or track your data</p>
          </div>
          <div className="glass border border-green-500/20 rounded-xl p-4 text-center">
            <UserCheck className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <h3 className="font-semibold text-white mb-1">Your Control</h3>
            <p className="text-sm text-gray-400">Access, modify, or delete anytime</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="glass border border-green-500/20 rounded-2xl p-8 space-y-8">
          
          {/* Data We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Database className="h-6 w-6 text-green-400" />
              Data We Collect
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Account Information</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong>Username:</strong> Your chosen display name</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong>Email Address:</strong> Used for account recovery and notifications (optional)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong>Password:</strong> Securely hashed using bcrypt encryption</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong>Minecraft Username:</strong> Linked to your in-game identity (optional)</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Usage Information</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong>Posts and Comments:</strong> Your social posts, forum threads, and replies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong>Private Messages:</strong> Encrypted communications between users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong>Server Activity:</strong> Basic gameplay statistics and online status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong>Profile Data:</strong> Bio, avatar, and other voluntary profile information</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Security Measures */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Lock className="h-6 w-6 text-green-400" />
              How We Protect Your Data
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Encryption</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span><strong>Passwords:</strong> Bcrypt hashed with salt rounds before storage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span><strong>Transmission:</strong> HTTPS/TLS encryption for all data in transit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span><strong>Database:</strong> Secure connections with encrypted credentials</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Access Control</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span><strong>Role-Based Access:</strong> Strict permission system (User, Moderator, Admin)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span><strong>Session Management:</strong> Secure tokens with automatic expiration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span><strong>API Protection:</strong> Rate limiting and authentication for sensitive endpoints</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Infrastructure Security</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span><strong>Environment Variables:</strong> Sensitive configuration stored securely</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span><strong>Input Validation:</strong> All user inputs are sanitized and validated</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span><strong>SQL Injection Prevention:</strong> Parameterized queries using Drizzle ORM</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span><strong>XSS Protection:</strong> Content sanitization and CSP headers</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* What We Don't Do */}
          <section className="bg-red-500/5 border border-red-500/20 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              What We DON'T Do
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-300">
              <div className="flex items-start gap-2">
                <span className="text-red-400 text-xl">✗</span>
                <span><strong>Sell Your Data:</strong> Never to third parties</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 text-xl">✗</span>
                <span><strong>Share Without Consent:</strong> Your data stays private</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 text-xl">✗</span>
                <span><strong>Track Extensively:</strong> Only essential data</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 text-xl">✗</span>
                <span><strong>Store Payment Info:</strong> No financial data</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 text-xl">✗</span>
                <span><strong>Read Private Messages:</strong> Your DMs are private</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 text-xl">✗</span>
                <span><strong>Use Tracking Cookies:</strong> No behavioral profiling</span>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-green-400" />
              Your Rights
            </h2>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Access:</strong> View all data we store about you</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Modify:</strong> Update or correct your information anytime</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Delete:</strong> Request complete account and data deletion</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Export:</strong> Download your data in a portable format (coming soon)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Opt-Out:</strong> Disable optional features and data collection</span>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Exercise Your Rights:</strong> Visit your{' '}
                <Link href="/settings" className="underline hover:text-blue-200">
                  profile settings
                </Link>{' '}
                to access, modify, or request deletion of your data.
              </p>
            </div>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Third-Party Services</h2>
            <div className="space-y-3 text-gray-300">
              <p>We use minimal third-party services to enhance functionality:</p>
              <div className="pl-4 space-y-2">
                <div>
                  <h4 className="font-semibold text-white">Minecraft Server Status</h4>
                  <ul className="text-sm space-y-1 mt-1">
                    <li>• <strong>Service:</strong> mcstatus.io API</li>
                    <li>• <strong>Purpose:</strong> Real-time server status and player counts</li>
                    <li>• <strong>Data Shared:</strong> Server IP addresses only (no personal data)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Authentication</h4>
                  <ul className="text-sm space-y-1 mt-1">
                    <li>• <strong>Method:</strong> NextAuth.js (self-hosted)</li>
                    <li>• <strong>Storage:</strong> Session data in our secure database</li>
                    <li>• <strong>Control:</strong> Fully under our management</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Compliance */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Compliance</h2>
            <p className="text-gray-300 mb-3">We strive to comply with:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-300">
              <div className="flex items-center gap-2">
                <span className="text-green-400">•</span>
                <span><strong>GDPR:</strong> General Data Protection Regulation (EU)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">•</span>
                <span><strong>CCPA:</strong> California Consumer Privacy Act</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">•</span>
                <span><strong>COPPA:</strong> Children's Online Privacy Protection</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">•</span>
                <span><strong>OWASP:</strong> Security best practices</span>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-green-500/5 border border-green-500/20 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-3">Questions About Your Privacy?</h2>
            <p className="text-gray-300 mb-4">
              Have concerns or questions about your data or privacy? We're here to help.
            </p>
            <div className="space-y-2 text-gray-300 text-sm">
              <p>• <strong>Response Time:</strong> We aim to respond within 48 hours</p>
              <p>• <strong>Support:</strong> Contact us through our community channels</p>
              <p>• <strong>Transparency:</strong> We're committed to open communication</p>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 pt-6 border-t border-white/10">
            <p>Last Updated: October 13, 2025</p>
            <p className="mt-2">Your trust is important to us. We continuously work to improve our security measures.</p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover-lift glow-green"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
