import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Navigation } from '@/components/layout/Navigation';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'Infinity Governance - Data Governance Platform',
  description: 'Production-grade data governance platform for discovering, cataloging, and governing data assets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Providers>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <Header />
            <div className="flex">
              <Navigation />
              <main className="flex-1">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}