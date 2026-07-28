
"use client"

import { useMemo } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"

/**
 * @fileOverview CategoryList - Instant Display Engine.
 * Decoupled from any mounting gates to ensure categories appear immediately from cache.
 */
export function CategoryList({ 
  activeCategory = 'all', 
  onCategoryChange,
  serviceMode = 'Food' 
}: { 
  activeCategory?: string, 
  onCategoryChange?: (id: string) => void,
  serviceMode?: string
}) {
  const firestore = useFirestore();
  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  // Use synchronized v3 cache key for parallel loading
  const { data: dbCategories } = useCollection<any>(categoriesQuery, 'home_categories_v3');

  const filteredCategories = useMemo(() => {
    if (!dbCategories) return [];
    return dbCategories.filter(cat => (cat.serviceType || 'Food').toLowerCase() === serviceMode.toLowerCase());
  }, [dbCategories, serviceMode]);

  return (
    <div className="py-4 px-4 overflow-hidden bg-white border-b border-gray-50">
      <div className="flex overflow-x-auto space-x-4 no-scrollbar px-2">
        {/* "ALL" Button is always rendered immediately */}
        <button 
          onClick={() => onCategoryChange?.('all')}
          className="flex flex-col items-center gap-2 shrink-0 group transition-all"
        >
          <div className={cn(
            "w-16 h-16 rounded-full border-2 flex items-center justify-center bg-white transition-all shadow-sm",
            activeCategory === 'all' ? "border-[#E11D48] scale-105" : "border-[#E5E7EB]"
          )}>
            <span className={cn(
              "text-[12px] font-black uppercase tracking-tighter",
              activeCategory === 'all' ? "text-[#111827]" : "text-[#9CA3AF]"
            )}>
              ALL
            </span>
          </div>
          <span className={cn(
            "text-[10px] font-black uppercase tracking-tighter",
            activeCategory === 'all' ? "text-[#E11D48]" : "text-[#6B7280]"
          )}>
            EXPLORE
          </span>
        </button>

        {filteredCategories.length > 0 ? (
          filteredCategories.map((cat) => {
            const catId = cat.name.toLowerCase();
            const isActive = activeCategory === catId;

            return (
              <button 
                key={cat.id} 
                onClick={() => onCategoryChange?.(catId)}
                className="flex flex-col items-center gap-2 shrink-0 group transition-all"
              >
                <div className={cn(
                  "relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all bg-muted",
                  isActive ? "border-[#E11D48] scale-105 shadow-md" : "border-transparent"
                )}>
                  <Image 
                    src={cat.imageUrl} 
                    alt={cat.name} 
                    fill 
                    className="object-cover" 
                    unoptimized 
                  />
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-tighter text-center max-w-[64px] truncate",
                  isActive ? "text-[#E11D48]" : "text-[#6B7280]"
                )}>
                  {cat.name}
                </span>
              </button>
            );
          })
        ) : (
          // Instant Skeleton placeholders if cache is empty
          [1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-16 h-16 rounded-full bg-muted/20 animate-pulse border-2 border-gray-100" />
              <div className="w-10 h-2 bg-muted/10 animate-pulse rounded-full" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
