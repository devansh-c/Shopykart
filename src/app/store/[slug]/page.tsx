import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import MenuContent from '@/components/menu/MenuContent';

export const dynamic = 'force-static';
// Removed dynamicParams = false to prevent 404 on new/unknown slugs

/**
 * @fileOverview Optimized Store Page for Static Export.
 * Providing a shell for static structure while allowing dynamic resolution.
 */
export async function generateStaticParams() {
  return [{ slug: 'view' }];
}

export default async function StorePage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

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
