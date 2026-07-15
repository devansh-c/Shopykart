
import { redirect } from 'next/navigation';

/**
 * @fileOverview Redirect legacy ID-based product routes to the unified Slug route.
 */
export default async function LegacyProductRedirect({ params }: { params: Promise<{ productId: string }> }) {
  const resolvedParams = await params;
  // Merged into single dynamic segment at the same level to avoid Next.js 15 conflict
  redirect(`/product/${resolvedParams.productId}`);
}
