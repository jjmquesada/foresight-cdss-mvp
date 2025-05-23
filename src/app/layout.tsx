// Removed 'use client';

import React from 'react';
import './globals.css';
import { Metadata } from 'next';

import PlasmaBackground from '../components/PlasmaBackground';
import GlassHeader from '@/components/layout/GlassHeader';
import GlassSidebar from '@/components/layout/GlassSidebar';
import MotionWrapper from '../components/MotionWrapper';

export const metadata: Metadata = {
  title: 'Foresight',
  description: 'Clinical Decision Support System for healthcare providers',
  // icons metadata can remain if src/app/favicon.ico is intended to be used by convention
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" as="image" href="/slower-load-animation.gif" />
      </head>
      <body>
        <PlasmaBackground />
        <GlassHeader />
        <div className="flex flex-1 overflow-hidden pt-16 h-[calc(100svh-4rem)] min-h-0">
          <GlassSidebar />
          <main className="flex flex-col flex-1 overflow-hidden relative">
            <React.Suspense fallback={<div>Loading page...</div>}>
              <MotionWrapper>{children}</MotionWrapper>
            </React.Suspense>
          </main>
        </div>
      </body>
    </html>
  );
}
