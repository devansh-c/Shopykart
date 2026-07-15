
import { redirect } from 'next/navigation';

/**
 * @fileOverview Neutralized to resolve dynamic route conflict with [slug].
 * Next.js cannot have [productId] and [slug] in the same directory level.
 */
export default async function LegacyProductRedirect({ params }: { params: Promise<{ productId: string }> }) {
  const resolvedParams = await params;
  // Redirect to the unified SEO-friendly route
  redirect(`/product/${resolvedParams.productId}`);
}
