/**
 * Enterprise Homepage - Premium Version
 * Modern hero section with features showcase
 */

import React from 'react';
import Link from 'next/link';
import { 
  Users, 
  Crown, 
  MessageSquare, 
  Trophy, 
  Sparkles, 
  Zap,
  Shield,
  ArrowRight,
  Check,
} from 'lucide-react';
import { DiscordButtonClient } from '@/components/home/discord-button-client';
import { Card, CardContent } from '@/components/ui/enterprise-card';
import { Button } from '@/components/ui/enterprise-button';
import dynamic from 'next/dynamic';
import { LiveServerStatus, LiveServerStatusSkeleton } from '@/components/home/live-server-status';
import { db } from '@/db';
import { servers } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { Suspense } from 'react';

const features = [
  {
    icon: Users,
    title: 'Vibrant Community',
    description: 'Join thousands of players in our active Minecraft community',
    color: 'text-brand-cyan',
  },
  {
    icon: Crown,
    title: 'Donor Ranks',
    description: 'Exclusive perks and ranks for our amazing supporters',
    color: 'text-warning',
  },
  {
    icon: MessageSquare,
    title: 'Discord Integration',
    description: 'Seamless chat bridging between in-game and Discord',
    color: 'text-primary',
  },
  {
    icon: Trophy,
    title: 'Leaderboards',
    description: 'Compete with other players and climb the ranks',
    color: 'text-success',
  },
  {
    icon: Sparkles,
    title: 'Events & Activities',
    description: 'Regular community events and special activities',
    color: 'text-brand-pink',
  },
  {
    icon: Shield,
    title: 'Advanced Moderation',
    description: 'Safe and welcoming environment for all players',
    color: 'text-info',
  },
];

const perks = [
  'Advanced XP & Leveling System',
  'Custom Donation Ranks',
  'Forum & Social Features',
  'Group & Guild System',
  'Achievement System',
  'Real-time Chat Bridge',
];

export default async function HomePage() {
  // Fetch all servers ordered by orderIndex
  const allServers = await db
    .select()
    .from(servers)
    .orderBy(asc(servers.orderIndex));

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background z-10" />
        
        <div className="container relative z-20 px-4 py-20 text-center space-y-8 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-brand text-white text-sm font-medium shadow-glow">
            <Sparkles className="h-4 w-4" />
            <span>Welcome to Vonix Network</span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            The Ultimate
            <br />
            <span className="gradient-text">Minecraft Community</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Join thousands of players in an amazing community with custom features, 
            events, and endless possibilities
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" variant="gradient" asChild>
              <Link href="/register">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            
            {/* Discord Button */}
            <DiscordButtonClient />
            
            <Button size="lg" variant="outline" asChild>
              <Link href="/servers">
                View Servers
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4">
        <div className="container">
          {/* Section Header */}
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              Why Choose <span className="gradient-text">Vonix Network</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience Minecraft like never before with our premium features and active community
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index}
                variant="glass" 
                hover
                className="group animate-slide-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 space-y-4">
                  <div className={`p-3 rounded-lg bg-white/5 w-fit group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Perks Section */}
      <section className="relative py-20 px-4">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="space-y-6 animate-slide-in-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Zap className="h-4 w-4" />
                <span>Premium Features</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold">
                Everything You Need,
                <br />
                <span className="gradient-text">All in One Place</span>
              </h2>
              
              <p className="text-lg text-muted-foreground">
                Vonix Network offers a complete Minecraft community experience with
                advanced features designed for both casual and hardcore players.
              </p>
              
              <div className="space-y-3 pt-4">
                {perks.map((perk, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
                      <Check className="h-4 w-4 text-success" />
                    </div>
                    <span className="text-muted-foreground">{perk}</span>
                  </div>
                ))}
              </div>
              
              <div className="pt-6">
                <Button size="lg" variant="primary" asChild>
                  <Link href="/register">
                    Join Now
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Side - Live Server Status */}
            <div className="animate-slide-in-right">
              <Suspense fallback={<LiveServerStatusSkeleton />}>
                <LiveServerStatus 
                  initialServers={allServers}
                  autoRefresh={true}
                  refreshInterval={60000}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4">
        <div className="container">
          <Card variant="gradient" glow className="text-center">
            <CardContent className="p-12 space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold">
                Ready to Start Your Adventure?
              </h2>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join our community today and experience Minecraft in a whole new way
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                <Button size="xl" variant="primary" asChild>
                  <Link href="/register">
                    Create Account
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                
                <Button size="xl" variant="glass" asChild>
                  <Link href="/forum">
                    Browse Forum
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
