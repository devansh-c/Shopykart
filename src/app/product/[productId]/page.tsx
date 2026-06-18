import { redirect } from 'next/navigation';

/**
 * @fileOverview Next.js 15 Compliant Redirect Page.
 * Handles dynamic segments by redirecting to a static view with query params.
 */
export default async function ProductIdPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  
  if (productId) {
    redirect(`/product/view?id=${productId}`);
  }
  
  redirect('/');
}

// Ensure build time optimization
export const dynamic = 'force-static';
export const revalidate = false;
