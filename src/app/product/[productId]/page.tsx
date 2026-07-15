/**
 * @fileOverview Neutralized to resolve dynamic route conflicts in Next.js 15.
 * All product routing is now handled by src/app/product/[slug]/page.tsx.
 */
import { redirect } from 'next/navigation';

export default async function NeutralizedProductPage() {
  // This route is purely a placeholder to prevent folder structure conflicts.
  // Next.js App Router fails when [productId] and [slug] exist at the same level.
  return null;
}
