import { Suspense } from 'react';
import ProductDetailsClient from '@/components/product/ProductDetailsClient';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Dynamic route for product details.
 * Fixed for Static Build: Uses fallback to prevent Publish errors.
 */

export const generateStaticParams = async () => {
  return [];
};

export const dynamicParams = true;

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
