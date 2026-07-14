'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, FileText, Loader2, Calendar } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

export default function StaticPageView({ forcedId }: { forcedId?: string }) {
  const searchParams = useSearchParams();
  const pageId = forcedId || searchParams.get('id');
  const router = useRouter();
  const firestore = useFirestore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const pageRef = useMemoFirebase(() => {
    if (!firestore || !pageId) return null;
    return doc(firestore, 'pages', String(pageId));
  }, [firestore, pageId]);

  const { data: page, loading } = useDoc<any>(pageRef);

  if (loading && !page) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-black italic uppercase">Page Not Found</h2>
        <button onClick={() => router.back()} className="mt-8 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase italic text-xs">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center border-b border-gray-100">
        <button onClick={() => router.push('/')} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors">
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="flex-1 text-center text-lg font-black uppercase italic tracking-tight">{page.title}</h1>
        <div className="w-10" />
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2 mb-10 pb-6 border-b border-dashed border-gray-200">
           <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <FileText className="h-6 w-6" />
           </div>
           <div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">{page.title}</h2>
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                 <Calendar className="h-3 w-3" />
                 Last Updated: {isMounted && page.updatedAt?.seconds ? format(new Date(page.updatedAt.seconds * 1000), 'MMM d, yyyy') : 'Recently'}
              </div>
           </div>
        </div>

        <article className="prose prose-sm max-w-none">
           <div 
             className="text-gray-700 leading-relaxed space-y-4 whitespace-pre-line font-medium"
             dangerouslySetInnerHTML={{ __html: page.content }}
           />
        </article>

        <div className="mt-20 pt-10 border-t border-gray-50 text-center">
           <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">ShopyKart Official Documentation</p>
        </div>
      </div>
    </div>
  );
}
