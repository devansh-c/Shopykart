import { redirect } from 'next/navigation';

/**
 * @fileOverview Redundant dynamic segment neutralized to resolve Next.js 15 Turbopack conflict.
 * All /product/* logic is now handled by src/app/product/[slug]/page.tsx.
 */

export const generateStaticParams = async () => {
  return [];
};

export default async function RedundantProductRedirect({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  // Redirect to the consolidated [slug] route which handles both IDs and Slugs
  redirect(`/product/${productId}/`);
  return null;
}
