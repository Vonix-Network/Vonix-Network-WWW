'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Gamepad2, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import SpaceBackground from '@/components/SpaceBackground';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.ok) {
        toast.success('Logged in successfully!');
        // Wait for session to be established, then redirect
        const session = await getSession();
        if (session) {
          const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
          router.push(callbackUrl);
          router.refresh();
        } else {
          // Fallback: force reload to establish session
          window.location.href = '/dashboard';
        }
      } else {
        toast.error('Login failed. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      {/* Space.js Animated Background */}
      <SpaceBackground 
        particles={60}
        speed={0.25}
        gradient={['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#ef4444']}
        size={{ min: 0.8, max: 1.5 }}
        opacity={{ min: 0.03, max: 0.3 }}
        connectionDistance={60}
        connectionOpacity={0.08}
        mouseInteraction={true}
        animateConnections={true}
        backgroundGradient={false}
      />

      {/* Floating Decoration */}
      <div className="absolute top-20 right-20 opacity-10 float">
        <Sparkles className="h-20 w-20 text-cyan-400" />
      </div>

      <div className="w-full max-w-md fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="relative">
              <img
                src="/static/images/logo-rm-bg.png"
                alt="Vonix Network"
                className="h-12 w-12 group-hover:scale-110 transition-transform"
              />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to continue your adventure</p>
        </div>

        {/* Login Card */}
        <div className="glass border border-cyan-400/20 rounded-2xl p-8 shadow-2xl hover-lift">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-cyan-400/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                  placeholder="Enter your username"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-cyan-400/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white py-3 rounded-lg font-bold overflow-hidden hover-lift glow-gradient disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? 'Signing in...' : 'Sign In'}
                {!isLoading && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <span className="text-gray-400 text-sm">Don't have an account? </span>
            <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-medium text-sm transition-colors">
              Create one now
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors inline-flex items-center gap-1">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
