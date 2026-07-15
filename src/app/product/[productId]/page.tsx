import { redirect } from 'next/navigation';

/**
 * @fileOverview Redundant dynamic segment neutralized to resolve Next.js 15 Turbopack conflict.
 * All /product/* logic is now handled by src/app/product/[slug]/page.tsx.
 */

export const generateStaticParams = async () => {
  return [];
};

export default async function NeutralizedProductRedirect({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  // This route is technically unreachable if Turbopack is happy, 
  // but if it exists, it MUST use a different param name OR be static.
  redirect(`/product/${productId}/`);
  return null;
}
