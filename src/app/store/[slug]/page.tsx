
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import MenuContent from '@/components/menu/MenuContent';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs } from 'firebase/firestore';
import { slugify } from '@/lib/utils';

export const dynamic = 'force-static';
export const dynamicParams = false;

/**
 * @fileOverview Automated Static Params for ALL Stores.
 * Fetches every vendor from Firestore at build time to prevent 404s in APK.
 */
export async function generateStaticParams() {
  try {
    const { firestore } = initializeFirebase();
    if (!firestore) return [];

    const snap = await getDocs(collection(firestore, 'vendors'));
    const params = snap.docs.map(doc => {
      const data = doc.data();
      // Ensure we generate params for BOTH Document ID and SEO Slug
      const id = doc.id;
      const slug = data.slug || slugify(data.storeName) || id;
      
      return [
        { slug: id },
        { slug: slug }
      ];
    }).flat();

    // Include hardcoded fallbacks just in case
    return [
      ...params,
      { slug: 'premium-store' },
      { slug: 'mr-burger' },
      { slug: 'shopykart' }
    ];
  } catch (err) {
    console.error("Failed to generate store params:", err);
    return [];
  }
}

export default async function StorePage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Opening Store Hub...</p>
        </div>
      </div>
    }>
      <MenuContent forcedSlug={slug} />
    </Suspense>
  );
}
