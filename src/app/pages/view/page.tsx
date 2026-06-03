
'use client';

import StaticPageView from '@/components/shared/StaticPageView';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Generic dynamic page viewer.
 * Uses query params (e.g., /pages/view?id=123) for 100% static hosting compatibility.
 */

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
