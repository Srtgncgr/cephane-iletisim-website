'use client';

import './globals.css';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import { usePathname } from 'next/navigation';
import { Providers } from './providers';
import { useEffect, useState } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Client-side rendering tamamlanana kadar basit layout göster
  if (!isClient) {
    return (
      <html lang="tr">
        <body>
          <Providers>
            <Header />
            {children}
            <Footer />
          </Providers>
        </body>
      </html>
    );
  }
  
  const isAdminPage = pathname?.startsWith('/admin');
  const isBlogPage = pathname?.startsWith('/blog');

  return (
    <html lang="tr">
      <body>
        <Providers>
          {!isAdminPage && <Header />}
          {children}
          {!isAdminPage && <Footer />}
        </Providers>
      </body>
    </html>
  );
} 