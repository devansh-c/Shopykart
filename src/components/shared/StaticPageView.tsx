"use client"

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, FileText, Loader2, Calendar } from 'lucide-react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, doc, getDoc, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { useEffect, useState, Suspense } from 'react';
import { extractIdFromSlug, slugify } from '@/lib/utils';

/**
 * @fileOverview StaticPageView that handles Clean Slugs (without IDs).
 * Prioritizes Slug field search for modern SEO URLs.
 */
function StaticPageViewContent({ forcedSlug }: { forcedSlug?: string }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawSlug = forcedSlug || (params?.slug as string) || searchParams.get('id');
  const router = useRouter();
  const firestore = useFirestore();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    async function resolvePage() {
      if (!firestore || !rawSlug) return;
      setLoading(true);
      try {
        // 1. Try SEO Slug Exact Match (Prioritized for Clean Links)
        const slugQ = query(collection(firestore, 'pages'), where('slug', '==', rawSlug), limit(1));
        const slugSnap = await getDocs(slugQ);

        if (!slugSnap.empty) {
          setPage({ id: slugSnap.docs[0].id, ...slugSnap.docs[0].data() });
          setLoading(false);
          return;
        }

        // 2. Try Document ID Match (For Direct Access or Internal links)
        const idRef = doc(firestore, 'pages', rawSlug);
        const idSnap = await getDoc(idRef);
        if (idSnap.exists()) {
          setPage({ id: idSnap.id, ...idSnap.data() });
          setLoading(false);
          return;
        }

        // 3. Fallback: Search for title slug if not found (Legacy Support)
        const possibleId = extractIdFromSlug(rawSlug);
        if (possibleId && possibleId !== rawSlug) {
          const fallbackRef = doc(firestore, 'pages', possibleId);
          const fallbackSnap = await getDoc(fallbackRef);
          if (fallbackSnap.exists()) {
            setPage({ id: fallbackSnap.id, ...fallbackSnap.data() });
          }
        }
      } catch (err) {
        console.error("Page resolution error:", err);
      } finally {
        setLoading(false);
      }
    }
    resolvePage();
  }, [firestore, rawSlug]);

  if (loading && !page) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!page && !loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-black italic uppercase text-muted-foreground">Page Not Found</h2>
        <button onClick={() => router.push('/')} className="mt-8 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase italic text-xs shadow-xl active:scale-95 transition-all">Go Back Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center border-b border-gray-100">
        <button onClick={() => router.push('/')} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors">
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="flex-1 text-center text-lg font-black uppercase italic tracking-tight truncate px-4">{page?.title}</h1>
        <div className="w-10" />
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-dashed border-gray-200">
           <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0"><FileText className="h-7 w-7" /></div>
           <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-tight">{page?.title}</h2>
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-muted-foreground tracking-widest mt-1.5">
                <Calendar className="h-3 w-3" /> Last Updated: {isMounted && page?.updatedAt?.seconds ? format(new Date(page.updatedAt.seconds * 1000), 'MMM d, yyyy') : 'Recently'}
              </div>
           </div>
        </div>
        <article className="prose prose-sm max-w-none">
           <div className="text-gray-700 leading-relaxed space-y-4 whitespace-pre-line font-medium text-sm md:text-base" dangerouslySetInnerHTML={{ __html: page?.content || '' }} />
        </article>
      </div>
    </div>
  );
}

export default function StaticPageView({ forcedSlug }: { forcedSlug?: string }) {
  return (
    <Suspense fallback={<div className="h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <StaticPageViewContent forcedSlug={forcedSlug} />
    </Suspense>
  );
}
