'use client';

import MenuContent from '@/components/menu/MenuContent';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

/**
 * @fileOverview Direct store view path with fallback resolution.
 * Wrapped in Suspense to prevent SSR bail-out issues.
 */
function StoreViewInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const slug = searchParams.get('slug');

  return (
    <MenuContent forcedSlug={id || slug || undefined} />
  );
}

export default function StoreViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Opening Gourmet Hub...</p>
        </div>
      </div>
    }>
      <StoreViewInner />
    </Suspense>
  );
}