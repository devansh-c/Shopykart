'use client';

import StaticPageView from '@/components/shared/StaticPageView';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function GenericPageViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <StaticPageView />
    </Suspense>
  );
}