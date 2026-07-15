import { redirect } from 'next/navigation';

/**
 * @fileOverview Neutralized to resolve routing conflict ('id' !== 'slug').
 * Redirects to the unified [slug] route.
 */
export default async function RedirectLegacyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/pages/${id}/`);
  return null;
}
