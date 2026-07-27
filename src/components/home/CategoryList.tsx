"use client"

import { useMemo } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"

const CATEGORY_COLORS = [
  'bg-[#F3E8FF]', // Purple
  'bg-[#FFF7ED]', // Orange
  'bg-[#FEE2E2]', // Red
  'bg-[#DCFCE7]', // Green
  'bg-[#E0F2FE]', // Blue
];

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
      <div className="flex space-x-3 px-4 py-4 overflow-x-auto no-scrollbar">
        {[1, 2, 3, 4].map(i => <div key={i} className="min-w-[100px] h-32 rounded-[2rem] bg-muted/20 animate-pulse" />)}
      </div>
    );
  }

  if (filteredCategories.length === 0) return null;

  return (
    <div className="py-4 px-4 overflow-hidden">
      <div className="flex overflow-x-auto space-x-3 no-scrollbar pb-2">
        {filteredCategories.map((cat, idx) => {
          const catId = cat.name.toLowerCase();
          const isActive = activeCategory === catId;
          const bgColor = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];

          return (
            <button 
              key={cat.id} 
              onClick={() => onCategoryChange?.(catId)}
              className={cn(
                "min-w-[100px] h-32 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all border-2",
                bgColor,
                isActive ? "border-primary shadow-xl scale-105" : "border-transparent opacity-90"
              )}
            >
              <div className="relative h-12 w-12 transform group-hover:scale-110 transition-transform">
                <Image src={cat.imageUrl} alt={cat.name} fill className="object-contain" unoptimized />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-black/60 italic leading-none">
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}