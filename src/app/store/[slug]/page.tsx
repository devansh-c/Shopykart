import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import MenuContent from '@/components/menu/MenuContent';

/**
 * generateStaticParams is strictly required for Next.js static export.
 */
export async function generateStaticParams() {
  return [];
}

export const dynamicParams = false;

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <MenuContent forcedSlug={slug} />
    </Suspense>
  );
}
