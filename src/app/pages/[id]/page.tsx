
import { redirect } from 'next/navigation';

/**
 * @fileOverview Neutralized to resolve plural/singular page route ambiguity.
 */
export default async function LegacyPageRedirect({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  redirect(`/page/${resolvedParams.id}`);
}
