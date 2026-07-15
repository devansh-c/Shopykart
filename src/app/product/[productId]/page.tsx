
import { redirect } from 'next/navigation';

/**
 * @fileOverview Redirect legacy ID-based product routes to the unified Slug route.
 * This prevents Internal Server Error due to segment conflict.
 */
export default async function LegacyProductRedirect({ params }: { params: Promise<{ productId: string }> }) {
  const resolvedParams = await params;
  redirect(`/product/${resolvedParams.productId}`);
}
