import { redirect } from 'next/navigation';

/**
 * @fileOverview Neutralized to resolve dynamic route conflicts.
 * Redirects to the consolidated /page/[slug] route.
 */

export const generateStaticParams = async () => {
  return [];
};

export default async function RedundantPagesRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/page/${id}/`);
  return null;
}
