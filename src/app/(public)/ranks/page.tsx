import { Suspense } from 'react';
import { db } from '@/db';
import { donationRanks } from '@/db/schema';
import { Award, Crown, Sparkles, Zap, Star, Gift } from 'lucide-react';

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function RanksContent() {
  const ranks = await db.select().from(donationRanks).orderBy(donationRanks.minAmount);

  return (
    <div className="max-w-7xl mx-auto">

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center relative">
        <div className="fade-in-up">
          <div className="inline-block mb-4 px-4 py-2 glass rounded-full border border-purple-500/20">
            <span className="text-sm text-purple-400 font-medium">👑 Support the Community</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text-animated">Donor Ranks</span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Support Vonix Network and unlock exclusive perks, custom colors, and special badges!
          </p>
        </div>
      </section>

      {/* Ranks Grid */}
      <section className="container mx-auto px-4 py-10 relative">
        {ranks.length === 0 ? (
          <div className="glass border border-purple-500/20 rounded-2xl p-12 text-center">
            <Award className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No donor ranks available yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ranks.map((rank, index) => (
              <div
                key={rank.id}
                className="group relative glass border rounded-2xl p-8 hover-lift transition-all"
                style={{
                  borderColor: `${rank.color}40`,
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                {/* Glow Effect */}
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl"
                  style={{ backgroundColor: `${rank.color}20` }}
                />

                <div className="relative z-10">
                  {/* Icon */}
                  <div 
                    className="inline-flex p-4 rounded-xl mb-4"
                    style={{ backgroundColor: `${rank.color}20` }}
                  >
                    {rank.icon ? (
                      <span className="text-4xl">{rank.icon}</span>
                    ) : (
                      <Award className="h-10 w-10" style={{ color: rank.color }} />
                    )}
                  </div>

                  {/* Rank Name */}
                  <h3 
                    className="text-2xl font-bold mb-2"
                    style={{ 
                      color: (rank.textColor && rank.textColor !== '#000000' && rank.textColor !== '#000') ? rank.textColor : '#ffffff',
                      textShadow: rank.glow ? `0 0 20px ${rank.color}` : 'none'
                    }}
                  >
                    {rank.name}
                  </h3>

                  {/* Badge */}
                  {rank.badge && (
                    <div 
                      className="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-4"
                      style={{
                        backgroundColor: `${rank.color}20`,
                        color: rank.textColor,
                        border: `1px solid ${rank.color}40`,
                      }}
                    >
                      {rank.badge}
                    </div>
                  )}

                  {/* Subtitle */}
                  {rank.subtitle && (
                    <p className="text-gray-400 mb-6">{rank.subtitle}</p>
                  )}

                  {/* Price */}
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-white mb-1">
                      ${rank.minAmount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {rank.duration} days duration
                    </div>
                  </div>

                  {/* Perks */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Sparkles className="h-4 w-4 text-green-400" />
                      <span>Custom colored username</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Star className="h-4 w-4 text-green-400" />
                      <span>Exclusive badge display</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Crown className="h-4 w-4 text-green-400" />
                      <span>Priority support</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Zap className="h-4 w-4 text-green-400" />
                      <span>Special Discord role</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Gift className="h-4 w-4 text-green-400" />
                      <span>Exclusive perks & features</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <a
                    href="#donate"
                    className="block w-full py-3 rounded-lg font-medium text-center transition-all hover:opacity-90"
                    style={{
                      backgroundColor: rank.color,
                      color: '#ffffff',
                    }}
                  >
                    Get {rank.name}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Donation Info Section */}
      <section id="donate" className="container mx-auto px-4 py-20 text-center relative">
        <div className="relative glass border border-purple-500/20 rounded-3xl p-12 md:p-16 overflow-hidden hover-lift">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Ready to Support?</h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Your donation helps keep Vonix Network running and supports ongoing development.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="https://paypal.me/vonixnetwork"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold overflow-hidden hover-lift"
              >
                <span className="relative z-10">Donate via PayPal</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              
              <button
                className="inline-flex items-center gap-2 glass border border-purple-500/30 px-8 py-4 rounded-xl text-lg font-medium text-white hover:border-purple-500/50 transition-all hover-lift"
              >
                Crypto Options
              </button>
            </div>

            <p className="text-sm text-gray-500 mt-6">
              After donating, contact an admin with your transaction ID to receive your rank!
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass border-t border-white/10 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Award className="h-6 w-6 text-purple-400" />
              <span className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Vonix Network. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="/" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">Home</a>
              <a href="/leaderboard" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">Leaderboard</a>
              <a href="/forum" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">Forum</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function RanksSkeleton() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section Skeleton */}
      <section className="container mx-auto px-4 py-20 text-center relative">
        <div className="h-12 w-64 bg-gray-700 rounded-full animate-pulse mx-auto mb-6" />
        <div className="h-16 w-96 bg-gray-700 rounded animate-pulse mx-auto mb-4" />
        <div className="h-6 w-80 bg-gray-700 rounded animate-pulse mx-auto" />
      </section>

      {/* Ranks Grid Skeleton */}
      <section className="container mx-auto px-4 py-10 relative">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass border border-gray-500/20 rounded-2xl p-8">
              <div className="w-16 h-16 bg-gray-700 rounded-xl animate-pulse mb-4" />
              <div className="h-8 w-32 bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-6 w-24 bg-gray-700 rounded-full animate-pulse mb-4" />
              <div className="h-4 w-full bg-gray-700 rounded animate-pulse mb-6" />
              <div className="h-10 w-24 bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-4 w-20 bg-gray-700 rounded animate-pulse mb-6" />
              <div className="space-y-3 mb-6">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-4 w-full bg-gray-700 rounded animate-pulse" />
                ))}
              </div>
              <div className="h-12 w-full bg-gray-700 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </section>

      {/* Donation Info Skeleton */}
      <section className="container mx-auto px-4 py-20 text-center relative">
        <div className="glass border border-purple-500/20 rounded-3xl p-12 md:p-16">
          <div className="h-12 w-96 bg-gray-700 rounded animate-pulse mx-auto mb-4" />
          <div className="h-6 w-80 bg-gray-700 rounded animate-pulse mx-auto mb-10" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="h-14 w-48 bg-gray-700 rounded-xl animate-pulse" />
            <div className="h-14 w-48 bg-gray-700 rounded-xl animate-pulse" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function RanksPage() {
  return (
    <Suspense fallback={<RanksSkeleton />}>
      <RanksContent />
    </Suspense>
  );
}
