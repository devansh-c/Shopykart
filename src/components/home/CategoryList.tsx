"use client"

import { useMemo } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * @fileOverview CategoryList - Optimized with SSR Initial Data.
 */
export function CategoryList({ 
  initialData,
  activeCategory = 'all', 
  onCategoryChange,
  serviceMode = 'Food' 
}: { 
  initialData?: any[],
  activeCategory?: string, 
  onCategoryChange?: (id: string) => void,
  serviceMode?: string
}) {
  const firestore = useFirestore();
  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  const { data: dbCategories, loading } = useCollection<any>(categoriesQuery, 'home_categories_v4_instant');

  const filteredCategories = useMemo(() => {
    const list = dbCategories || initialData || [];
    return list.filter(cat => (cat.serviceType || 'Food').toLowerCase() === serviceMode.toLowerCase());
  }, [dbCategories, initialData, serviceMode]);

  return (
    <div className="py-4 px-4 overflow-hidden bg-white border-b border-gray-50 min-h-[110px]">
      <div className="flex overflow-x-auto space-x-4 no-scrollbar px-2">
        <button onClick={() => onCategoryChange?.('all')} className="flex flex-col items-center gap-2 shrink-0 transition-all">
          <div className={cn("w-16 h-16 rounded-full border-2 flex items-center justify-center bg-white transition-all shadow-sm", activeCategory === 'all' ? "border-primary scale-105" : "border-gray-100")}>
            <span className={cn("text-[12px] font-black uppercase tracking-tighter", activeCategory === 'all' ? "text-gray-900" : "text-gray-400")}>ALL</span>
          </div>
          <span className={cn("text-[10px] font-black uppercase tracking-tighter", activeCategory === 'all' ? "text-primary" : "text-gray-500")}>EXPLORE</span>
        </button>

        {(filteredCategories.length === 0 && loading) ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0">
              <Skeleton className="w-16 h-16 rounded-full" />
              <Skeleton className="w-10 h-2 rounded-full" />
            </div>
          ))
        ) : filteredCategories.map((cat) => (
          <button key={cat.id} onClick={() => onCategoryChange?.(cat.name.toLowerCase())} className="flex flex-col items-center gap-2 shrink-0 transition-all">
            <div className={cn("relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all bg-muted", activeCategory === cat.name.toLowerCase() ? "border-primary scale-105 shadow-md" : "border-transparent")}>
              <Image src={cat.imageUrl} alt={cat.name} fill className="object-cover" unoptimized />
            </div>
            <span className={cn("text-[10px] font-black uppercase tracking-tighter text-center max-w-[64px] truncate", activeCategory === cat.name.toLowerCase() ? "text-primary" : "text-gray-500")}>{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}