import ProductDetailsClient from '@/components/product/ProductDetailsClient';

/**
 * @fileOverview Server Component wrapper for Product details.
 * In static export mode, we must define sample params and disable dynamicParams.
 */

export async function generateStaticParams() {
  // Return a sample ID to satisfy the build requirement.
  // The actual fetching happens on the client side in ProductDetailsClient.
  return [{ productId: 'featured' }];
}

export const dynamic = 'force-static';
export const dynamicParams = false;

export default function ProductPage() {
  return <ProductDetailsClient />;
}
