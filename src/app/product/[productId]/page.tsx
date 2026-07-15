import { redirect } from 'next/navigation';

/**
 * @fileOverview Neutralized to resolve dynamic route conflict in Next.js 15.
 * All dynamic matching for /product/* is now handled by src/app/product/[slug]/page.tsx.
 */

export const generateStaticParams = async () => {
  return [];
};

export default async function LegacyProductRedirect({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  redirect(`/product/${productId}/`);
  return null;
}
