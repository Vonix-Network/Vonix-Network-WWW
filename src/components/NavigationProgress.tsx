'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

/**
 * Navigation progress bar
 * Shows loading indicator when navigating between pages
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Configure NProgress
    NProgress.configure({
      showSpinner: false,
      trickleSpeed: 200,
      minimum: 0.08,
    });
  }, []);

  useEffect(() => {
    // Start progress bar
    NProgress.start();

    // Complete it after a short delay (navigation has happened)
    const timeout = setTimeout(() => {
      NProgress.done();
    }, 100);

    return () => {
      clearTimeout(timeout);
      NProgress.done();
    };
  }, [pathname, searchParams]);

  return null;
}
