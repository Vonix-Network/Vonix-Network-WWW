import { db } from '@/db';
import { donations, users, siteSettings } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { Heart, DollarSign, Bitcoin, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { DonationsPageClient } from '@/components/donations/donations-page-client';
import { Avatar } from '@/components/ui/avatar';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function DonationsPage() {
  // Note: Database migrations should be handled by your deployment process

  // Get donation settings
  let settingsData: Array<{ value: string | null }> = [];
  try {
    settingsData = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, 'donation_settings'));
  } catch {
    // If table doesn't exist yet for some reason, fall back to defaults below
    settingsData = [];
  }
  
  const defaultSettings = {
    paypalEmail: 'donations@vonix-network.com',
    paypalMeUrl: 'https://paypal.me/vonixnetwork',
    solanaAddress: 'CUH7SK5eK9LXJuwU1Y5uYSFV1ivPJ5yE8VTNXPHemxLr',
    bitcoinAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  };

  let donationSettings = defaultSettings;
  if (settingsData.length > 0 && settingsData[0].value) {
    try {
      donationSettings = { ...defaultSettings, ...JSON.parse(settingsData[0].value as string) };
    } catch {
      // Use defaults if parsing fails
    }
  }

  // Get recent donations (displayed ones only)
  const recentDonations = await db
    .select({
      id: donations.id,
      userId: donations.userId,
      username: users.username,
      minecraftUsername: donations.minecraftUsername,
      avatar: users.avatar,
      amount: donations.amount,
      currency: donations.currency,
      method: donations.method,
      message: donations.message,
      createdAt: donations.createdAt,
    })
    .from(donations)
    .leftJoin(users, eq(donations.userId, users.id))
    .where(eq(donations.displayed, true))
    .orderBy(desc(donations.createdAt))
    .limit(50);

  return (
    <DonationsPageClient donationSettings={donationSettings}>
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="text-center py-20 relative">
          <div className="fade-in-up">
            <div className="inline-block mb-4 px-4 py-2 glass rounded-full border border-pink-500/20">
              <span className="text-sm text-pink-400 font-medium">💖 Community Powered</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-text-animated">Support Vonix Network</span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Your donations help keep our servers online and support ongoing development. Thank you for your support!
            </p>
          </div>
        </section>

        {/* Donation Methods */}
        <section className="mb-12">
          <div className="grid md:grid-cols-2 gap-6">
            {/* PayPal */}
            <div className="glass border border-blue-500/20 rounded-2xl p-8 hover-lift">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">PayPal</h3>
                  <p className="text-gray-400">Fast & Secure</p>
                </div>
              </div>
              
              <p className="text-gray-400 mb-6">
                Donate via PayPal for instant processing. All major credit cards accepted.
              </p>
              
              {donationSettings.paypalEmail && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-2">PayPal Email:</p>
                  <code className="block px-4 py-2 bg-slate-900/50 rounded-lg text-green-400 text-sm">
                    {donationSettings.paypalEmail}
                  </code>
                </div>
              )}
              
              {donationSettings.paypalMeUrl && (
                <a
                  href={donationSettings.paypalMeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium text-center hover-lift"
                >
                  Donate via PayPal
                </a>
              )}
            </div>

            {/* Crypto */}
            <div className="glass border border-purple-500/20 rounded-2xl p-8 hover-lift">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl text-purple-400">◎</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Solana (SOL)</h3>
                  <p className="text-gray-400">Fast & Low Fees</p>
                </div>
              </div>
              
              <p className="text-gray-400 mb-6">
                Support us with Solana or other cryptocurrencies. Click to view wallet addresses and QR codes.
              </p>
              
              {donationSettings.solanaAddress && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-2">Solana Address:</p>
                  <code className="block px-4 py-2 bg-slate-900/50 rounded-lg text-purple-400 text-xs break-all">
                    {donationSettings.solanaAddress}
                  </code>
                </div>
              )}
              
              <button
                data-crypto-button
                className="block w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium text-center hover-lift glow-purple"
              >
                View Crypto Options
              </button>
            </div>
          </div>
        </section>

        {/* Important Note */}
        <div className="glass border border-yellow-500/20 rounded-2xl p-6 mb-12 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <Heart className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-white mb-2">After Donating</h3>
              <p className="text-gray-400 text-sm">
                Please contact an admin on Discord with your transaction ID and desired rank. 
                Your rank will be activated within 24 hours. Check out our <Link href="/ranks" className="text-green-400 hover:underline">donor ranks</Link> to see available perks!
              </p>
            </div>
          </div>
        </div>

        {/* Recent Supporters */}
        <section>
          <div className="glass border border-pink-500/20 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Heart className="h-6 w-6 text-pink-400" />
                <span className="gradient-text">Recent Supporters</span>
              </h2>
              <p className="text-gray-400 text-sm mt-1">Thank you to our amazing community!</p>
            </div>

            {recentDonations.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Heart className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <p>Be the first to support Vonix Network!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {recentDonations.map((donation) => (
                  <div
                    key={donation.id}
                    className="p-6 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative w-12 h-12">
                        <Avatar 
                          username={donation.username || 'Anonymous'}
                          minecraftUsername={donation.minecraftUsername}
                          avatar={donation.avatar}
                          size="lg"
                          className="border-2 border-pink-500/30"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-white">
                            {donation.username || 'Anonymous'}
                          </span>
                          <span className="text-2xl font-bold text-pink-400">
                            ${donation.amount.toFixed(2)} {donation.currency}
                          </span>
                          {donation.method && (
                            <span className="px-2 py-1 bg-slate-800 rounded text-xs text-gray-400">
                              {donation.method}
                            </span>
                          )}
                        </div>
                        
                        {donation.message && (
                          <p className="text-gray-400 italic">"{donation.message}"</p>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(donation.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-20">
          <div className="relative glass border border-purple-500/20 rounded-3xl p-12 hover-lift overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <Heart className="h-16 w-16 text-pink-400 mx-auto mb-6" />
              <h2 className="text-4xl font-bold text-white mb-4">Every Contribution Matters</h2>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Your support helps us maintain servers, develop new features, and grow our community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/ranks"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold hover-lift"
                >
                  View Donor Ranks
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-8 py-4 glass border border-pink-500/30 text-white rounded-xl font-medium hover:border-pink-500/50 transition-all"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DonationsPageClient>
  );
}