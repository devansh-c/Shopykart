import { Suspense } from 'react';
import ProductDetailsClient from '@/components/product/ProductDetailsClient';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-static';
export const dynamicParams = false;

/**
 * @fileOverview Product details static export.
 * Returning a placeholder to satisfy the mandatory generateStaticParams requirement.
 */
export async function generateStaticParams() {
  return [{ slug: 'gourmet-item' }];
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Loading Gourmet Details...</p>
        </div>
      </div>
    }>
      <ProductDetailsClient forcedSlug={slug} />
    </Suspense>
  );
}
