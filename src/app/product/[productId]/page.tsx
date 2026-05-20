import ProductDetailsClient from '@/components/product/ProductDetailsClient';

/**
 * @fileOverview Server Component wrapper for Product details.
 * Fixes "missing generateStaticParams" error for output: export.
 */

export async function generateStaticParams() {
  return []; // Dynamic routes will be handled on client side via Firestore
}

export default function ProductPage() {
  return <ProductDetailsClient />;
}
