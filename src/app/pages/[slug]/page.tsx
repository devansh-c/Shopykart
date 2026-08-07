import { Suspense } from 'react';
import StaticPageView from '@/components/shared/StaticPageView';
import { Loader2 } from 'lucide-react';

/**
 * generateStaticParams is required for Next.js static export.
 */
export function generateStaticParams() {
  return [];
}

export const dynamicParams = false;

export default async function GenericPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Retrieving Information...</p>
        </div>
      </div>
    }>
      <StaticPageView forcedSlug={slug} />
    </Suspense>
  );
}
