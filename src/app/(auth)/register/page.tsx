'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Gamepad2, Lock, KeyRound, ArrowRight, ArrowLeft, Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'code' | 'details'>('code');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      toast.error('Code must be 6 characters');
      return;
    }

    setStep('details');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/.test(password)) {
      toast.error('Password must contain both letters and numbers');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/registration/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Registration failed');
        return;
      }

      toast.success('Account created successfully!');
      router.push('/login');
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 animate-gradient-xy" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Floating Decoration */}
      <div className="absolute top-20 left-20 opacity-10 float">
        <Sparkles className="h-20 w-20 text-blue-400" />
      </div>

      <div className="w-full max-w-md fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="relative">
              <Gamepad2 className="h-12 w-12 text-blue-400 group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-blue-400/20 blur-xl group-hover:bg-blue-400/40 transition-all" />
            </div>
            <span className="text-3xl font-bold gradient-text-animated">Vonix Network</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-400">Register with your Minecraft code</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'code' ? 'bg-green-500 text-white' : 'bg-green-500/20 text-green-400'} transition-all`}>
            {step === 'details' ? <Check className="h-5 w-5" /> : '1'}
          </div>
          <div className={`h-1 w-12 ${step === 'details' ? 'bg-green-500' : 'bg-green-500/20'} transition-all`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'details' ? 'bg-green-500 text-white' : 'bg-green-500/20 text-green-400'} transition-all`}>
            2
          </div>
        </div>

        {/* Register Card */}
        <div className="glass border border-green-500/20 rounded-2xl p-8 shadow-2xl hover-lift">
          {step === 'code' ? (
            <form onSubmit={handleCodeSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="code" className="block text-sm font-medium text-gray-300">
                  Registration Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="code"
                    type="text"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all font-mono text-lg text-center tracking-wider"
                  />
                </div>
                <div className="glass border border-green-500/10 rounded-lg p-3 mt-3">
                  <p className="text-xs text-gray-400">
                    💡 Use <code className="bg-green-500/20 text-green-400 px-2 py-1 rounded font-mono">/register</code> in-game to get your code
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="group relative w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-bold overflow-hidden hover-lift glow-green"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Continue
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="glass border border-green-500/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-300">
                  Code: <span className="font-mono font-bold text-green-400">{code}</span>
                </p>
              </div>

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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                    placeholder="Create a password"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Min 6 characters, must contain letters and numbers
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                    placeholder="Confirm your password"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('code')}
                  className="glass border border-blue-500/30 px-6 py-3 rounded-lg text-white hover:border-blue-500/50 transition-all hover-lift disabled:opacity-50"
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-bold overflow-hidden hover-lift glow-gradient disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? 'Creating...' : 'Create Account'}
                    {!isLoading && <Check className="h-5 w-5" />}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </form>
          )}

          {/* Login Link */}
          <div className="mt-6 text-center">
            <span className="text-gray-400 text-sm">Already have an account? </span>
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors">
              Sign In
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-400 hover:text-blue-400 text-sm transition-colors inline-flex items-center gap-1">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
