import { Suspense } from 'react';
import ProductDetailsClient from '@/components/product/ProductDetailsClient';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-static';

/**
 * @fileOverview Product details dynamic page with static export compatibility.
 */
export async function generateStaticParams() {
  // Providing a placeholder to satisfy the build requirement
  return [{ slug: 'gourmet-item' }];
}

export default async function ProductPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const slug = params.slug;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Loading Gourmet Details...</p>
        </div>
      </div>
    }>
      <ProductDetailsClient forcedSlug={slug === 'gourmet-item' ? undefined : slug} />
    </Suspense>
  );
}
