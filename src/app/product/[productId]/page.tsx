
import ProductDetailsClient from '@/components/product/ProductDetailsClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Server Component wrapper for Product details.
 * Corrected naming and async param handling to prevent ISE.
 */

export async function generateStaticParams() {
  return [
    { productId: 'featured' },
    { productId: 'latest' },
    { productId: 'trending' }
  ];
}

export const dynamic = 'force-static';
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ productId: string }>;
}

export default async function ProductDynamicPage({ params }: PageProps) {
  const { productId } = await params;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ProductDetailsClient forcedId={productId} />
    </Suspense>
  );
}
