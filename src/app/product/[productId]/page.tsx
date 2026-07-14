import { Suspense } from 'react';
import ProductDetailsClient from '@/components/product/ProductDetailsClient';
import { Loader2 } from 'lucide-react';
import type { Metadata } from 'next';

/**
 * @fileOverview Dynamic route for product details with SEO Optimization.
 */

export const generateStaticParams = async () => {
  // Static export requires params to be provided at build time or handled at runtime
  return [];
};

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const productId = resolvedParams.productId;

  // Since we use static export, we can't fetch Firestore here directly at build time easily
  // Google will see the metadata once the client-side branding loader kicks in, 
  // but for initial crawl, we provide a structured title.
  return {
    title: `Order Product #${productId.slice(-5)} | ShopyKart`,
    description: 'Order premium gourmet food from ShopyKart. Fast delivery in Ranipur and Mauranipur.',
    openGraph: {
      title: 'Premium Product | ShopyKart',
      images: [`https://picsum.photos/seed/${productId}/800/600`],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const resolvedParams = await params;
  const productId = resolvedParams.productId;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <ProductDetailsClient forcedId={productId} />
    </Suspense>
  );
}
