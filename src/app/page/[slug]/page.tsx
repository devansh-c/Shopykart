
import { Suspense } from 'react';
import StaticPageView from '@/components/shared/StaticPageView';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-static';

/**
 * @fileOverview Static export configuration for Policy Pages.
 */
export async function generateStaticParams() {
  return [
    { slug: 'cancellation-policy' },
    { slug: 'terms-and-conditions' },
    { slug: 'privacy-policy' },
    { slug: 'return-policy' },
    { slug: 'shipping-policy' }
  ];
}

export default async function GenericPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Retrieving Information...</p>
        </div>
      </div>
    }>
      <StaticPageView forcedSlug={slug} />
    </Suspense>
  );
}
