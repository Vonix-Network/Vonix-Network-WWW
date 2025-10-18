import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
// Import warmup to ensure connections are ready
import '@/lib/init-warmup';

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vonix Network - Minecraft Community',
  description: 'A comprehensive Minecraft community platform with forums, social features, and more',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
