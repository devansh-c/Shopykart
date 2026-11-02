
import { Suspense } from 'react';
import ProductDetailsClient from '@/components/product/ProductDetailsClient';
import { Loader2 } from 'lucide-react';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { slugify } from '@/lib/utils';

export const dynamic = 'force-static';
export const dynamicParams = false;

/**
 * @fileOverview Automated Static Params for popular products.
 * Fetches top 100 products from Firestore at build time for APK static pages.
 */
export async function generateStaticParams() {
  try {
    const { firestore } = initializeFirebase();
    if (!firestore) return [];

    // Limit to 100 most popular items to keep build time reasonable
    const q = query(collection(firestore, 'products'), limit(100));
    const snap = await getDocs(q);
    
    const params = snap.docs.map(doc => {
      const data = doc.data();
      const id = doc.id;
      const slug = data.slug || slugify(data.name) || id;
      
      return [
        { slug: id },
        { slug: slug }
      ];
    }).flat();

    return [
      ...params,
      { slug: 'featured-dish' },
      { slug: 'classic-burger' }
    ];
  } catch (err) {
    console.error("Failed to generate product params:", err);
    return [];
  }
}

export default async function ProductPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Loading Gourmet Details...</p>
      </div>
    }>
      <ProductDetailsClient forcedSlug={slug} />
    </Suspense>
  );
}
