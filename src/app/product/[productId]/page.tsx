import { redirect } from 'next/navigation';

/**
 * @fileOverview LEGACY REDIRECT to resolve dynamic route conflict.
 * Overwrites [productId] folder to ensure [slug] is the primary dynamic path.
 */
export default async function LegacyProductRedirect({ params }: { params: Promise<{ productId: string }> }) {
  const resolvedParams = await params;
  redirect(`/product/${resolvedParams.productId}`);
}
