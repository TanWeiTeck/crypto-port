import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'CryptoPort - Portfolio Tracker',
  description: 'Track your cryptocurrency portfolio with ease',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <Providers>
          <div className="min-h-screen bg-background">
            <Header />
            <main className="max-w-md mx-auto px-4 pt-18 pb-20 space-y-4">
              {children}
            </main>
            <BottomNavigation />
          </div>
        </Providers>
      </body>
    </html>
  );
}
