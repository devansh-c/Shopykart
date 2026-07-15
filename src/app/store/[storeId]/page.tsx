import { redirect } from 'next/navigation';

/**
 * @fileOverview LEGACY REDIRECT to resolve dynamic route conflict.
 * Overwrites [storeId] folder to ensure [slug] is the primary dynamic path.
 */
export default async function LegacyStoreRedirect({ params }: { params: Promise<{ storeId: string }> }) {
  const resolvedParams = await params;
  redirect(`/store/${resolvedParams.storeId}`);
}
