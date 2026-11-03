
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import MenuContent from '@/components/menu/MenuContent';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, doc, getDoc, query, where, limit } from 'firebase/firestore';
import { slugify } from '@/lib/utils';

export const dynamic = 'force-static';
export const dynamicParams = false;

/**
 * @fileOverview Optimized Store Page with Server-Side Data Baking.
 * Fetches vendor profile AND its products at build time for 0ms load.
 */

export async function generateStaticParams() {
  try {
    const { firestore } = initializeFirebase();
    if (!firestore) return [];

    const snap = await getDocs(collection(firestore, 'vendors'));
    const params = snap.docs.map(doc => {
      const data = doc.data();
      const id = doc.id;
      const slug = data.slug || slugify(data.storeName) || id;
      
      return [
        { slug: id },
        { slug: slug }
      ];
    }).flat();

    return params;
  } catch (err) {
    console.error("Failed to generate store params:", err);
    return [];
  }
}

async function getStoreInitialData(slug: string) {
  try {
    const { firestore } = initializeFirebase();
    if (!firestore) return { vendor: null, products: [] };

    let vendorData: any = null;
    let vendorId: string = '';

    // 1. Resolve Vendor by ID
    const idRef = doc(firestore, 'vendors', slug);
    const idSnap = await getDoc(idRef);
    if (idSnap.exists()) {
      vendorData = { id: idSnap.id, ...idSnap.data() };
      vendorId = idSnap.id;
    } else {
      // 2. Resolve Vendor by Slug
      const slugQ = query(collection(firestore, 'vendors'), where('slug', '==', slug), limit(1));
      const slugSnap = await getDocs(slugQ);
      if (!slugSnap.empty) {
        vendorData = { id: slugSnap.docs[0].id, ...slugSnap.docs[0].data() };
        vendorId = slugSnap.docs[0].id;
      }
    }

    if (!vendorId) return { vendor: null, products: [] };

    // 3. Fetch all products for this vendor
    const productsQ = query(collection(firestore, 'products'), where('vendorId', '==', vendorId));
    const productsSnap = await getDocs(productsQ);
    const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return JSON.parse(JSON.stringify({ vendor: vendorData, products }));
  } catch (error) {
    console.error("Store pre-fetch error:", error);
    return { vendor: null, products: [] };
  }
}

export default async function StorePage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const initialData = await getStoreInitialData(slug);

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Opening Store Hub...</p>
      </div>
    }>
      <MenuContent 
        forcedSlug={slug} 
        initialVendor={initialData.vendor} 
        initialProducts={initialData.products} 
      />
    </Suspense>
  );
}
