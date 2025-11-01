'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="glass border border-red-500/20 rounded-2xl p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex p-4 bg-red-500/10 rounded-full">
              <AlertTriangle className="h-12 w-12 text-red-400" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Something Went Wrong
          </h2>
          
          <p className="text-gray-400 mb-6">
            An unexpected error occurred in the dashboard.
            {error.digest && (
              <span className="block text-sm text-gray-500 mt-2">
                Error ID: {error.digest}
              </span>
            )}
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-black/30 rounded-lg text-left">
              <p className="text-xs text-red-400 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-cyan to-brand-blue text-white rounded-lg font-medium hover-lift transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-6 py-3 glass border border-brand-cyan/20 text-white rounded-lg font-medium hover-lift transition-all"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
