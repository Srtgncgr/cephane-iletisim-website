'use client';

import React from 'react';
import './admin.module.css';
import CustomAdminWrapper from '../components/CustomAdminWrapper';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Özel wrapper bileşeni ile header ve footer'ı gizle
  return (
    <CustomAdminWrapper>
      {children}
    </CustomAdminWrapper>
  );
} 