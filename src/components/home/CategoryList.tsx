
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
    // Only show categories matching the current service mode
    return dbCategories.filter(cat => {
      const type = cat.serviceType || 'Food'; // Default existing to Food
      return type === serviceMode;
    });
  }, [dbCategories, serviceMode]);

  if (loading || filteredCategories.length === 0) return null;

  return (
    <div className="py-4">
      <div className="flex items-center justify-between px-6 mb-5">
        <h2 className="text-2xl font-black italic tracking-tighter uppercase">
          {serviceMode === 'Medical' ? 'Healthcare Categories' : 'Categories'}
        </h2>
      </div>
      <div className="flex overflow-x-auto space-x-6 px-6 no-scrollbar">
        <button 
          onClick={() => onCategoryChange?.('all')}
          className="flex flex-col items-center space-y-2 min-w-[70px] relative group"
        >
          <div className={cn(
            "relative h-16 w-16 rounded-full overflow-hidden border-2 transition-all duration-300 flex items-center justify-center bg-white",
            activeCategory === 'all' ? "border-primary ring-4 ring-primary/10" : "border-transparent bg-muted/30"
          )}>
            <span className="text-[10px] font-black">ALL</span>
          </div>
          <span className={cn("text-[10px] font-black uppercase", activeCategory === 'all' ? "text-primary" : "text-muted-foreground")}>
            View All
          </span>
        </button>

        {filteredCategories.map((cat) => {
          const catId = cat.name.toLowerCase();
          const isActive = activeCategory === catId;

          return (
            <button 
              key={cat.id} 
              onClick={() => onCategoryChange?.(catId)}
              className="flex flex-col items-center space-y-2 min-w-[70px] relative group"
            >
              <div className={cn(
                "relative h-16 w-16 rounded-full overflow-hidden border-2 transition-all duration-300",
                isActive ? "border-primary ring-4 ring-primary/10 scale-105" : "border-transparent bg-muted/30"
              )}>
                <Image
                  src={cat.imageUrl}
                  alt={cat.name}
                  fill
                  className="object-cover"
                />
              </div>
              <span className={cn(
                "text-[10px] font-black transition-colors uppercase tracking-tight",
                isActive ? "text-primary" : "text-muted-foreground"
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
