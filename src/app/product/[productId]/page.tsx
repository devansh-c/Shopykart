import { redirect } from 'next/navigation';

/**
 * @fileOverview Redirecting legacy ID-based route to unified [slug] route to resolve Next.js conflict.
 */
export default async function RedirectLegacyProduct({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  redirect(`/product/${productId}/`);
  return null;
}
