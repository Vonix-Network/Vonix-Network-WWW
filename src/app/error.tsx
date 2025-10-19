'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console
    console.error('Page error:', error);

    // TODO: Send to error tracking service
    // Example: Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="glass border border-red-500/20 rounded-2xl p-8 text-center fade-in-up">
          {/* Error Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-6 float">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>

          {/* Error Message */}
          <h1 className="text-3xl font-bold text-white mb-4">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-400 mb-6">
            We encountered an unexpected error while loading this page.
          </p>

          {/* Error Details (Development only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-left">
              <p className="text-sm font-mono text-red-400 mb-2">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-500">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all font-medium hover-lift"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </button>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-6 py-3 glass border border-blue-500/20 text-white rounded-lg hover:border-blue-500/40 transition-all font-medium hover-lift"
            >
              <Home className="h-4 w-4" />
              <span>Go Home</span>
            </Link>
          </div>

          {/* Help Text */}
          <p className="text-sm text-gray-500 mt-6">
            If this problem persists, please{' '}
            <Link href="/support" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
