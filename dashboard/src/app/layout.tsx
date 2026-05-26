import type { Metadata } from 'next';
import './globals.css';
import { DataProvider } from '@/context/DataContext';
import Layout from '@/components/Layout';
import AppErrorBoundary from '@/components/AppErrorBoundary';

export const metadata: Metadata = {
  title: 'Digital PR Orchestrator Dashboard',
  description: 'Control center for Digital PR workflow automation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <AppErrorBoundary>
          <DataProvider>
            <Layout>{children}</Layout>
          </DataProvider>
        </AppErrorBoundary>
      </body>
    </html>
  );
}
