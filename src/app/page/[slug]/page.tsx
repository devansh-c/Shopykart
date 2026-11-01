
import { Suspense } from 'react';
import StaticPageView from '@/components/shared/StaticPageView';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-static';
export const dynamicParams = true;

/**
 * @fileOverview Static export configuration for Policy Pages.
 */
export async function generateStaticParams() {
  return [
    { slug: 'cancellation-policy' },
    { slug: 'terms-and-conditions' },
    { slug: 'privacy-policy' },
    { slug: 'return-policy' }
  ];
}

export default async function GenericPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Retrieving Information...</p>
      </div>
    }>
      <StaticPageView forcedSlug={slug} />
    </Suspense>
  );
}
