'use client';

import React, { useEffect } from 'react';

/**
 * Admin sayfaları için özel layout bileşeni
 * Bu bileşen, admin sayfalarında header ve footer'ı gizlemek için kullanılır
 */
export default function CustomAdminWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Admin sayfası açıldığında body'ye admin-page class'ını ekle
    document.body.classList.add('admin-page');
    
    // Component unmount olduğunda class'ı kaldır
    return () => {
      document.body.classList.remove('admin-page');
    };
  }, []);

  return (
    <div className="admin-wrapper">
      {children}
    </div>
  );
} 