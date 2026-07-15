import { redirect } from 'next/navigation';

/**
 * @fileOverview Neutralized to resolve routing conflict ('storeId' !== 'slug').
 * Redirects to the unified [slug] route.
 */
export default async function RedirectLegacyStore({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  redirect(`/store/${storeId}/`);
  return null;
}
