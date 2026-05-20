import ProductDetailsClient from '@/components/product/ProductDetailsClient';

/**
 * @fileOverview Server Component wrapper for Product details.
 * Fixes "missing param in generateStaticParams" error for output: export.
 */

export async function generateStaticParams() {
  // Return a dummy ID for build time. 
  // Next.js requires this for static export of dynamic routes.
  return [{ productId: 'featured' }];
}

// Ensure the page is treated as static but can handle dynamic client routing
export const dynamic = 'force-static';
export const dynamicParams = true;

export default function ProductPage() {
  return <ProductDetailsClient />;
}
