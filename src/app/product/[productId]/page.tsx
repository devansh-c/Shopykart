import ProductDetailsClient from '@/components/product/ProductDetailsClient';

/**
 * @fileOverview Server Component wrapper for Product details.
 * In static export mode, we must define sample params and disable dynamicParams.
 */

export async function generateStaticParams() {
  // Return sample IDs to satisfy the build requirement for static export.
  // The actual fetching happens on the client side in ProductDetailsClient.
  return [
    { productId: 'featured' },
    { productId: 'latest' },
    { productId: 'trending' }
  ];
}

// Ensure the page is treated as static for the export process
export const dynamic = 'force-static';
export const dynamicParams = false;

export default function ProductPage() {
  return <ProductDetailsClient />;
}
