import { redirect } from 'next/navigation';

/**
 * @fileOverview Redirect segment neutralized to resolve Next.js dynamic routing conflict.
 * Consolidates logic into the [slug] route.
 */

export const generateStaticParams = async () => {
  return [];
};

export default async function RedundantProductRedirect({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  // Redirect to the unified SEO route
  redirect(`/product/${productId}/`);
  return null;
}
