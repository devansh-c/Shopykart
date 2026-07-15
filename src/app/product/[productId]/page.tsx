/**
 * @fileOverview Neutralized to resolve dynamic route conflicts in Next.js 15.
 * All product routing is now handled by src/app/product/[slug]/page.tsx.
 */
import { redirect } from 'next/navigation';

export default async function NeutralizedProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const resolvedParams = await params;
  redirect(`/product/${resolvedParams.productId}`);
  return null;
}
