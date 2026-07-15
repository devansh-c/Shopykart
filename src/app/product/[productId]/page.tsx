import { redirect } from 'next/navigation';

/**
 * @fileOverview Neutralized to resolve routing conflict ('productId' !== 'slug').
 * Redirects to the unified [slug] route.
 */
export default async function RedirectLegacyProduct({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  redirect(`/product/${productId}/`);
  return null;
}
