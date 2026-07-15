
import { redirect } from 'next/navigation';

/**
 * @fileOverview Neutralized to resolve dynamic route conflict with [slug].
 */
export default async function LegacyStoreRedirect({ params }: { params: Promise<{ storeId: string }> }) {
  const resolvedParams = await params;
  redirect(`/store/${resolvedParams.storeId}`);
}
