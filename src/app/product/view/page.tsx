
'use client';

import ProductDetailsClient from '@/components/product/ProductDetailsClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Direct product view path.
 * Wrapped in Suspense to prevent SSR bail-out issues.
 */
export default function ProductViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ProductDetailsClient />
    </Suspense>
  );
}
