'use client';

import { usePathname } from 'next/navigation';
import BackgroundManager from './BackgroundManager';

/**
 * Client wrapper for BackgroundManager
 * Forces remount on pathname change by using pathname as key
 */
export default function BackgroundWrapper() {
  const pathname = usePathname();
  
  // Use pathname as key to force complete remount on navigation
  return <BackgroundManager key={pathname} />;
}
