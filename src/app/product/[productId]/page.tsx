import ProductDetailsClient from '@/components/product/ProductDetailsClient';

/**
 * @fileOverview Server Component wrapper for Product details.
 * Fixes "missing param in generateStaticParams" error for output: export.
 */

export async function generateStaticParams() {
  // We provide a default ID to satisfy the static export requirement.
  // Real product IDs will be handled dynamically on the client.
  return [{ productId: 'featured' }];
}

export default function ProductPage() {
  return <ProductDetailsClient />;
}
