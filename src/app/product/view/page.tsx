
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import ProductDetailsClient from '@/components/product/ProductDetailsClient';

/**
 * @fileOverview Dynamic Product Shell for Static Export.
 * Resolves ID from Query Params to prevent 404 in APK.
 */
function ProductViewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (!id) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white p-8 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Fetching Gourmet Details...</p>
      </div>
    );
  }

  return <ProductDetailsClient forcedSlug={id} />;
}

export default function ProductViewPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <ProductViewContent />
    </Suspense>
  );
}
