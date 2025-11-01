'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Admin panel error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-lg w-full">
        <div className="glass border border-purple-500/20 rounded-2xl p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex p-4 bg-purple-500/10 rounded-full">
              <AlertTriangle className="h-12 w-12 text-purple-400" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Admin Panel Error
          </h2>
          
          <p className="text-gray-400 mb-6">
            An error occurred in the admin panel.
            {error.digest && (
              <span className="block text-sm text-gray-500 mt-2">
                Error ID: {error.digest}
              </span>
            )}
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-black/30 rounded-lg text-left">
              <p className="text-xs text-purple-400 font-mono break-all">
                {error.message}
              </p>
              {error.stack && (
                <pre className="text-xs text-gray-500 mt-2 overflow-auto max-h-32">
                  {error.stack}
                </pre>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover-lift transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            <Link
              href="/admin"
              className="flex items-center justify-center gap-2 px-6 py-3 glass border border-purple-500/20 text-white rounded-lg font-medium hover-lift transition-all"
            >
              <LayoutDashboard className="h-4 w-4" />
              Admin Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
