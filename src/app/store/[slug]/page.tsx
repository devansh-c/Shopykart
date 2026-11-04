import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import MenuContent from '@/components/menu/MenuContent';

export const dynamic = 'force-static';
export const dynamicParams = false;

/**
 * @fileOverview Optimized Store Page for Static Export.
 * Removed generateStaticParams logic to avoid massive file generation during build.
 * This keeps the APK size small (~20MB) by handling dynamic data on the client.
 */
export async function generateStaticParams() {
  // Return just one dummy entry to satisfy the static requirement without bloat
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
