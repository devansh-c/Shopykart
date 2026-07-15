import { redirect } from 'next/navigation';

/**
 * @fileOverview Redirecting legacy ID-based route to unified [slug] route to resolve Next.js conflict.
 */
export default async function RedirectLegacyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/pages/${id}/`);
  return null;
}
