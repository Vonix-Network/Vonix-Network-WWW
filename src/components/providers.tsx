'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';
import { useEffect } from 'react';
import { performanceMonitor } from '@/lib/performance';

// Create a wrapper component to handle QueryClient setup
function QueryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Track page load performance
    performanceMonitor.trackPageLoad(window.location.pathname);

    // Track route changes for SPA navigation
    const handleRouteChange = (url: string) => {
      performanceMonitor.trackPageLoad(url);
    };

    // Listen for route changes (if using Next.js router)
    if (typeof window !== 'undefined') {
      const handlePopState = () => handleRouteChange(window.location.pathname);
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <WebSocketProvider>
          <QueryProvider>
            {children}
            <Toaster position="top-right" richColors />
          </QueryProvider>
        </WebSocketProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
