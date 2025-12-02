import '../styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import Script from 'next/script';
import { SWRProvider } from '@/components/SWRProvider';
import HealthIndicator from '@/components/HealthIndicator';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Blog Frontend',
  description: 'A responsive blog application built with Next.js',
  keywords: ['blog', 'posts', 'articles', 'Next.js'],
  authors: [{ name: 'Blog Team' }],
  openGraph: {
    title: 'Blog Frontend',
    description: 'A responsive blog application built with Next.js',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Restore SPA route from 404.html redirect */}
        <Script id="spa-redirect-restore" strategy="beforeInteractive">
          {`
            (function() {
              var redirect = sessionStorage.getItem('spa-redirect');
              if (redirect) {
                sessionStorage.removeItem('spa-redirect');
                if (redirect !== '/' && redirect !== window.location.pathname) {
                  window.history.replaceState(null, '', redirect);
                }
              }
            })();
          `}
        </Script>
        <SWRProvider>
          <div className="min-h-screen bg-gray-50">
            {/* Global screen reader announcement region */}
            <div
              id="announcer"
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
            />
            
            {/* Skip to main content link for keyboard users */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Skip to main content
            </a>
            
            {/* Header with health status indicator */}
            <header className="bg-white shadow-sm border-b border-gray-200">
              <div className="container mx-auto px-4 py-3 max-w-4xl flex justify-between items-center">
                <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                  Blog
                </Link>
                <HealthIndicator />
              </div>
            </header>
            
            <main id="main-content" className="container mx-auto px-4 py-8 max-w-4xl">
              {children}
            </main>
          </div>
        </SWRProvider>
      </body>
    </html>
  );
}
