import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, Gamepad2, MessageSquare, Users, Shield, Sparkles, Zap } from 'lucide-react';
import { LiveChat } from '@/components/chat/LiveChat';
import { getServerSession } from '@/lib/auth';
import { PublicNav } from '@/components/public/nav';

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const session = await getServerSession();
  
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 animate-gradient-xy" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <PublicNav user={session?.user ? { id: session.user.id, username: session.user.name || '', role: session.user.role || 'user' } : null} />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32 text-center relative">
        {/* Floating Icons */}
        <div className="absolute top-20 left-10 opacity-20 float">
          <Sparkles className="h-12 w-12 text-green-400" />
        </div>
        <div className="absolute top-40 right-10 opacity-20 float" style={{ animationDelay: '1s' }}>
          <Zap className="h-16 w-16 text-emerald-400" />
        </div>
        
        <div className="fade-in-up">
          <div className="inline-block mb-4 px-4 py-2 glass rounded-full border border-green-500/20">
            <span className="text-sm text-green-400 font-medium">🎮 Powered by Modern Technology</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text-animated">Welcome to</span>
            <br />
            <span className="text-white">Vonix Network</span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            A comprehensive Minecraft community platform with <span className="text-blue-400 font-semibold">real-time chat</span>, 
            <span className="text-purple-400 font-semibold"> forums</span>, 
            <span className="text-pink-400 font-semibold"> social features</span>, and more.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center scale-in">
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-bold overflow-hidden hover-lift glow-gradient"
            >
              <span className="relative z-10">Join Now</span>
              <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-2 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 shimmer" />
            </Link>
            
            <Link
              href="/about"
              className="inline-flex items-center gap-2 glass border border-blue-500/30 px-8 py-4 rounded-xl text-lg font-medium text-white hover:border-blue-500/50 transition-all hover-lift"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 relative">
        <div className="text-center mb-16 fade-in-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Why Choose</span> Vonix Network?
          </h2>
          <p className="text-gray-400 text-lg">Experience the future of Minecraft communities</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<MessageSquare className="h-10 w-10" />}
            title="Real-time Chat"
            description="Integrated Discord chat with live messaging and community interaction"
            delay="0s"
          />
          <FeatureCard
            icon={<Users className="h-10 w-10" />}
            title="Social Platform"
            description="Connect with friends, share posts, and engage with the community"
            delay="0.1s"
          />
          <FeatureCard
            icon={<Shield className="h-10 w-10" />}
            title="Secure Auth"
            description="Seamless in-game registration and authentication system"
            delay="0.2s"
          />
          <FeatureCard
            icon={<Gamepad2 className="h-10 w-10" />}
            title="Server Management"
            description="Track server status, players, and game information"
            delay="0.3s"
          />
        </div>
      </section>

      {/* Live Chat Section */}
      <section className="container mx-auto px-4 py-20 relative">
        <div className="text-center mb-12 fade-in-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Join the Conversation</span>
          </h2>
          <p className="text-gray-400 text-lg">Connect with our community in real-time</p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <LiveChat readOnly={true} showInput={false} messageLimit={20} disableAutoScroll={true} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center relative">
        <div className="relative glass border border-green-500/20 rounded-3xl p-12 md:p-16 overflow-hidden hover-lift">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Ready to Join?</h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Create your account today and become part of our <span className="text-green-400 font-semibold">growing community</span>.
            </p>
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-10 py-5 rounded-xl text-lg font-bold overflow-hidden hover-lift glow-green-lg"
            >
              <span className="relative z-10">Create Account</span>
              <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-2 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 shimmer" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass border-t border-white/10 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-6 w-6 text-green-400" />
              <span className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Vonix Network. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/about" className="text-sm text-gray-400 hover:text-green-400 transition-colors">About</Link>
              <Link href="/terms" className="text-sm text-gray-400 hover:text-green-400 transition-colors">Terms</Link>
              <Link href="/privacy" className="text-sm text-gray-400 hover:text-green-400 transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay = '0s',
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: string;
}) {
  return (
    <div 
      className="group relative glass border border-blue-500/10 rounded-2xl p-8 hover-lift hover:border-blue-500/30 transition-all"
      style={{ animationDelay: delay }}
    >
      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 rounded-2xl transition-all" />
      
      <div className="relative z-10">
        <div className="mb-4 inline-flex p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
