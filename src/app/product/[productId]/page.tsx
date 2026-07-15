/**
 * @fileOverview Route Neutralized.
 * This file is kept to resolve file-system dynamic segment conflicts in Next.js 15.
 * All logic has been migrated to src/app/product/[slug]/page.tsx.
 */
import { redirect } from 'next/navigation';

export default async function NeutralizedProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const resolvedParams = await params;
  redirect(`/product/${resolvedParams.productId}`);
  return null;
}
