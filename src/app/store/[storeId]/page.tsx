import { redirect } from 'next/navigation';

/**
 * @fileOverview Redirecting legacy ID-based route to unified [slug] route to resolve Next.js conflict.
 */
export default async function RedirectLegacyStore({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  redirect(`/store/${storeId}/`);
  return null;
}
