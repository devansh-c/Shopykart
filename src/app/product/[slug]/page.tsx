import { Suspense } from 'react';
import ProductDetailsClient from '@/components/product/ProductDetailsClient';
import { Loader2 } from 'lucide-react';

/**
 * generateStaticParams is required for Next.js static export.
 */
export function generateStaticParams() {
  return [];
}

export const dynamicParams = false;

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <ProductDetailsClient forcedSlug={slug} />
    </Suspense>
  );
}
