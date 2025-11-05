import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, Gamepad2, MessageSquare, Users, Shield, Sparkles, Zap } from 'lucide-react';
import { LiveChat } from '@/components/chat/LiveChat';
import { getServerSession } from '@/lib/auth';
import { EnhancedNav } from '@/components/nav/enhanced-nav';
import SpaceBackground from '@/components/SpaceBackground';

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const session = await getServerSession();
  
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Space.js Animated Background */}
      <SpaceBackground 
        particles={180}
        speed={0.7}
        gradient={['#00D9FF', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316']}
        size={{ min: 1.2, max: 4 }}
        opacity={{ min: 0.12, max: 0.8 }}
        connectionDistance={140}
        connectionOpacity={0.25}
        mouseInteraction={true}
        animateConnections={true}
        backgroundGradient={false}
      />

      {/* Header */}
      <EnhancedNav user={session?.user} />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32 text-center relative">
        {/* Floating Icons */}
        <div className="absolute top-20 left-10 opacity-20 float">
          <Sparkles className="h-12 w-12 text-brand-cyan" />
        </div>
        <div className="absolute top-40 right-10 opacity-20 float" style={{ animationDelay: '1s' }}>
          <Zap className="h-16 w-16 text-brand-cyan" />
        </div>
        
        <div className="fade-in-up">
          <div className="inline-block mb-4 px-4 py-2 glass rounded-full border border-brand-cyan/30 shadow-lg shadow-brand-cyan/20">
            <span className="text-sm text-brand-cyan font-medium">🎮 Powered by Modern Technology</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text-animated">Welcome to</span>
            <br />
            <span className="text-white">Vonix Network</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            A comprehensive Minecraft community platform with <span className="text-brand-cyan font-semibold">real-time chat</span>, 
            <span className="text-brand-purple font-semibold"> forums</span>, 
            <span className="text-brand-pink font-semibold"> social features</span>, and more.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center scale-in">
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-purple text-white px-8 py-4 rounded-xl text-lg font-bold overflow-hidden hover-lift shadow-lg shadow-brand-cyan/40 hover:shadow-brand-cyan/60 transition-all"
            >
              <span className="relative z-10">Join Now</span>
              <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-2 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-purple via-brand-pink to-brand-orange opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 shimmer" />
            </Link>
            
            <Link
              href="/about"
              className="inline-flex items-center gap-2 glass border border-brand-cyan/30 px-8 py-4 rounded-xl text-lg font-medium text-white hover:border-brand-cyan/60 hover:shadow-lg hover:shadow-brand-cyan/20 transition-all hover-lift"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-8 relative">
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
      <section className="container mx-auto px-4 py-8 relative">
        <LiveChat readOnly={true} showInput={false} messageLimit={100} disableAutoScroll={true} />
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center relative">
        <div className="relative glass border border-brand-cyan/20 rounded-3xl p-12 md:p-16 overflow-hidden hover-lift shadow-2xl shadow-brand-cyan/10">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/10 via-transparent to-brand-purple/10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-purple/20 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Ready to Join?</h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Create your account today and become part of our <span className="text-brand-cyan font-semibold">growing community</span>.
            </p>
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-purple text-white px-10 py-5 rounded-xl text-lg font-bold overflow-hidden hover-lift shadow-xl shadow-brand-cyan/40 hover:shadow-brand-cyan/60 transition-all"
            >
              <span className="relative z-10">Create Account</span>
              <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-2 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-purple via-brand-pink to-brand-orange opacity-0 group-hover:opacity-100 transition-opacity" />
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
              <Gamepad2 className="h-6 w-6 text-brand-cyan" />
              <span className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Vonix Network. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/about" className="text-sm text-gray-400 hover:text-brand-cyan transition-colors">About</Link>
              <Link href="/terms" className="text-sm text-gray-400 hover:text-brand-cyan transition-colors">Terms</Link>
              <Link href="/privacy" className="text-sm text-gray-400 hover:text-brand-cyan transition-colors">Privacy</Link>
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
      className="group relative glass border border-brand-cyan/10 rounded-2xl p-8 hover-lift hover:border-brand-cyan/30 hover:shadow-lg hover:shadow-brand-cyan/10 transition-all"
      style={{ animationDelay: delay }}
    >
      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/0 to-brand-purple/0 group-hover:from-brand-cyan/5 group-hover:to-brand-purple/5 rounded-2xl transition-all" />
      
      <div className="relative z-10">
        <div className="mb-4 inline-flex p-3 bg-brand-cyan/10 rounded-xl text-brand-cyan group-hover:scale-110 group-hover:bg-brand-cyan/20 group-hover:shadow-lg group-hover:shadow-brand-cyan/30 transition-all">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-2 text-white group-hover:text-brand-cyan transition-colors">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
