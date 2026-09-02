import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import MenuContent from '@/components/menu/MenuContent';

export const dynamic = 'force-static';

/**
 * @fileOverview Store hub dynamic page with static export compatibility.
 */
export async function generateStaticParams() {
  // Providing a placeholder to satisfy the build requirement
  return [{ slug: 'premium-store' }];
}

export default async function StorePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const slug = params.slug;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Opening Store Hub...</p>
        </div>
      </div>
    }>
      <MenuContent forcedSlug={slug === 'premium-store' ? undefined : slug} />
    </Suspense>
  );
}
