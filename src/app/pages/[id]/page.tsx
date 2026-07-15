import { redirect } from 'next/navigation';

/**
 * @fileOverview Neutralized to resolve dynamic route conflicts.
 * Redirects to the consolidated /page/[slug] route.
 */

export const generateStaticParams = async () => {
  return [];
};

export default async function RedundantPagesRedirect({ params }: { params: any }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  redirect(`/page/${id}/`);
  return null;
}
