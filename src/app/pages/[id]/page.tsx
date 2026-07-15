import { redirect } from 'next/navigation';

/**
 * @fileOverview Redirect segment neutralized to resolve Next.js dynamic routing conflict.
 * Consolidates logic into the /page/[slug] route.
 */

export const generateStaticParams = async () => {
  return [];
};

export default async function RedundantPagesRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/page/${id}/`);
  return null;
}
