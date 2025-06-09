'use client';

import React from 'react';

/**
 * Admin sayfaları için özel layout bileşeni
 * Bu bileşen, admin sayfalarında header ve footer'ı gizlemek için kullanılır
 */
export default function CustomAdminWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-wrapper">
      {children}
      <style jsx global>{`
        /* Admin sayfalarında header ve footer'ı gizle */
        body > div > header,
        body > div > footer {
          display: none !important;
        }
        
        /* Admin layout için ek stiller */
        .admin-wrapper {
          min-height: 100vh;
        }
      `}</style>
    </div>
  );
} 