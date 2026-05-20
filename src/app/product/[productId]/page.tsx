import ProductDetailsClient from '@/components/product/ProductDetailsClient';

// Required for Next.js Static Export with dynamic routes
// This satisfies the build requirement while allowing live data on the client
export async function generateStaticParams() {
  return [];
}

export default function ProductPage() {
  return <ProductDetailsClient />;
}
