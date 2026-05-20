
'use client';

import ProductDetailsClient from '@/components/product/ProductDetailsClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Product details page.
 * Uses query params (e.g., /product/view?id=123) for 100% static hosting compatibility.
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
