import { redirect } from 'next/navigation';

/**
 * @fileOverview Redundant dynamic segment neutralized to resolve Next.js 15 Turbopack conflict.
 * All /product/* logic is now handled by src/app/product/[slug]/page.tsx.
 */

export const generateStaticParams = async () => {
  return [];
};

export default async function RedundantProductRedirect({ params }: { params: any }) {
  const resolvedParams = await params;
  const id = resolvedParams.productId;
  redirect(`/product/${id}/`);
  return null;
}
