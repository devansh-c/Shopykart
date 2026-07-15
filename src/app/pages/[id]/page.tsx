
import { redirect } from 'next/navigation';

/**
 * @fileOverview Redirect legacy ID-based info pages to the unified /page/[slug] route.
 */
export default async function LegacyPageRedirect({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  // Redirect to new unified /page/[slug] structure
  redirect(`/page/${resolvedParams.id}`);
}
