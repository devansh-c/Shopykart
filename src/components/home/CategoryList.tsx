
"use client"

import { useMemo } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"

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

  const { data: dbCategories, loading } = useCollection<any>(categoriesQuery);

  const filteredCategories = useMemo(() => {
    if (!dbCategories) return [];
    return dbCategories.filter(cat => (cat.serviceType || 'Food').toLowerCase() === serviceMode.toLowerCase());
  }, [dbCategories, serviceMode]);

  if (loading && !dbCategories) {
    return (
      <div className="flex space-x-6 px-6 py-6 overflow-x-auto no-scrollbar">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-muted/20 animate-pulse" />
            <div className="w-16 h-3 bg-muted/20 animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="py-6 px-4 overflow-hidden bg-white">
      <div className="flex overflow-x-auto space-x-6 no-scrollbar px-2">
        {/* VIEW ALL / ALL ITEM */}
        <button 
          onClick={() => onCategoryChange?.('all')}
          className="flex flex-col items-center gap-3 shrink-0 group transition-all"
        >
          <div className={cn(
            "w-24 h-24 rounded-full border-[3px] flex items-center justify-center bg-white transition-all shadow-sm",
            activeCategory === 'all' ? "border-[#E11D48] scale-105 shadow-md" : "border-[#E5E7EB]"
          )}>
            <span className={cn(
              "text-base font-black uppercase tracking-tighter transition-colors",
              activeCategory === 'all' ? "text-[#111827]" : "text-[#9CA3AF]"
            )}>
              ALL
            </span>
          </div>
          <span className={cn(
            "text-[11px] font-black uppercase tracking-tighter",
            activeCategory === 'all' ? "text-[#E11D48]" : "text-[#6B7280]"
          )}>
            VIEW ALL
          </span>
        </button>

        {/* DYNAMIC CATEGORIES */}
        {filteredCategories.map((cat) => {
          const catId = cat.name.toLowerCase();
          const isActive = activeCategory === catId;

          return (
            <button 
              key={cat.id} 
              onClick={() => onCategoryChange?.(catId)}
              className="flex flex-col items-center gap-3 shrink-0 group transition-all"
            >
              <div className={cn(
                "relative w-24 h-24 rounded-full overflow-hidden border-[3px] transition-all bg-muted",
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
                "text-[11px] font-black uppercase tracking-tighter text-center max-w-[96px] truncate",
                isActive ? "text-[#E11D48]" : "text-[#6B7280]"
              )}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
