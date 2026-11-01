import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import MenuContent from '@/components/menu/MenuContent';

export const dynamic = 'force-static';
export const dynamicParams = false;

/**
 * @fileOverview Store hub dynamic page with static export compatibility.
 * Next.js 15 requires generateStaticParams for dynamic routes in static export mode.
 * Set to dynamicParams: false to satisfy export requirements.
 */
export async function generateStaticParams() {
  return [
    { slug: 'premium-store' },
    { slug: 'mr-burger' },
    { slug: 'shopykart' },
    { slug: 'local-hub' }
  ];
}

export default async function StorePage(props: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await props.params;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Opening Store Hub...</p>
        </div>
      </div>
    }>
      <MenuContent forcedSlug={resolvedParams.slug} />
    </Suspense>
  );
}
