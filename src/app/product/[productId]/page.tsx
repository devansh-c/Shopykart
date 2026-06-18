import ProductDetailsClient from '@/components/product/ProductDetailsClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Server Component wrapper for Product details.
 * Updated for Next.js 15: params must be awaited.
 */

export async function generateStaticParams() {
  // Return sample IDs to satisfy the build requirement for static export.
  return [
    { productId: 'featured' },
    { productId: 'latest' },
    { productId: 'trending' }
  ];
}

// Ensure the page is treated as static for the export process
export const dynamic = 'force-static';
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ productId: string }>;
}

export default async function ProductPage({ params }: PageProps) {
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
