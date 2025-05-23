'use client';

import AdvisorView from '@/components/views/AdvisorView';
import React from 'react';
import LoadingAnimation from '@/components/LoadingAnimation';

export default function AdvisorPage() {
  return (
    <React.Suspense fallback={<LoadingAnimation />}>
      <AdvisorView />
    </React.Suspense>
  );
}
