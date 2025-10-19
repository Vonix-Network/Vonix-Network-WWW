'use client';

import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="glass border border-blue-500/20 rounded-2xl p-12 fade-in-up">
          {/* 404 Number */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold gradient-text-animated">
              404
            </h1>
          </div>

          {/* Message */}
          <h2 className="text-3xl font-bold text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all font-medium hover-lift"
            >
              <Home className="h-4 w-4" />
              <span>Go Home</span>
            </Link>
            <Link
              href="/search"
              className="flex items-center gap-2 px-6 py-3 glass border border-blue-500/20 text-white rounded-lg hover:border-blue-500/40 transition-all font-medium hover-lift"
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
            </Link>
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-6 py-3 glass border border-blue-500/20 text-white rounded-lg hover:border-blue-500/40 transition-all font-medium hover-lift"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Go Back</span>
            </button>
          </div>

          {/* Popular Pages */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-sm text-gray-500 mb-4">Popular pages:</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/social"
                className="px-4 py-2 text-sm glass border border-blue-500/20 text-gray-300 rounded-lg hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
              >
                Social
              </Link>
              <Link
                href="/forum"
                className="px-4 py-2 text-sm glass border border-blue-500/20 text-gray-300 rounded-lg hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
              >
                Forum
              </Link>
              <Link
                href="/blog"
                className="px-4 py-2 text-sm glass border border-blue-500/20 text-gray-300 rounded-lg hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
              >
                Blog
              </Link>
              <Link
                href="/leaderboard"
                className="px-4 py-2 text-sm glass border border-blue-500/20 text-gray-300 rounded-lg hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
              >
                Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
