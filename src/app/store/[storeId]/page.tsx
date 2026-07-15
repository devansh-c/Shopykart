'use client';

import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import MenuContent from '@/components/menu/MenuContent';

/**
 * @fileOverview SEO Friendly dynamic route for stores.
 * Handles format: /store/name-slug-ID
 */
export default function StorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}
