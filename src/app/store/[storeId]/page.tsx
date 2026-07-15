
import { redirect } from 'next/navigation';

/**
 * @fileOverview Redirect legacy ID-based store routes to the unified Slug route.
 */
export default async function LegacyStoreRedirect({ params }: { params: Promise<{ storeId: string }> }) {
  const resolvedParams = await params;
  // Merged into single dynamic segment at the same level to avoid Next.js 15 conflict
  redirect(`/store/${resolvedParams.storeId}`);
}
