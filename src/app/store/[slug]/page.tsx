
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import MenuContent from '@/components/menu/MenuContent';

export const dynamic = 'force-static';

/**
 * @fileOverview Store hub dynamic page with static export compatibility.
 * Next.js 15 requires generateStaticParams for dynamic routes in static export mode.
 */
export async function generateStaticParams() {
  // Providing sample slugs to satisfy the build process
  return [
    { slug: 'premium-store' },
    { slug: 'local-hub' },
    { slug: 'shopykart' }
  ];
}

export default async function StorePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const slug = params.slug;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Opening Store Hub...</p>
      </div>
    }>
      <MenuContent forcedSlug={slug} />
    </Suspense>
  );
}
