
"use client"

import Image from 'next/image';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

type CategoryListProps = {
  activeCategory?: string;
  onCategoryChange?: (id: string) => void;
};

const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'All', imageUrl: 'https://picsum.photos/seed/all-cat/100/100' },
  { id: 'snacks', name: 'Snacks', imageUrl: 'https://picsum.photos/seed/snacks-cat/100/100' },
  { id: 'pizza', name: 'Pizza', imageUrl: 'https://picsum.photos/seed/shopy-piz/100/100' },
  { id: 'burgers', name: 'Burgers', imageUrl: 'https://picsum.photos/seed/shopy-burg/100/100' },
  { id: 'pasta', name: 'Pasta', imageUrl: 'https://picsum.photos/seed/shopy-pasta/100/100' },
  { id: 'drinks', name: 'Drinks', imageUrl: 'https://picsum.photos/seed/shopy-drink/100/100' },
];

export function CategoryList({ activeCategory = 'all', onCategoryChange }: CategoryListProps) {
  const firestore = useFirestore();

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  const { data: dbCategories } = useCollection<any>(categoriesQuery);

  const categories = dbCategories && dbCategories.length > 0 
    ? [{ id: 'all', name: 'All', imageUrl: 'https://picsum.photos/seed/all-cat/100/100' }, ...dbCategories.map(c => ({ id: c.name.toLowerCase(), name: c.name, imageUrl: c.imageUrl }))]
    : DEFAULT_CATEGORIES;

  return (
    <div className="py-4">
      <div className="flex items-center justify-between px-6 mb-5">
        <h2 className="text-2xl font-black italic tracking-tighter uppercase">Categories</h2>
        <Link href="/menu" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">
          See all
        </Link>
      </div>
      <div className="flex overflow-x-auto space-x-6 px-6 no-scrollbar">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;

          return (
            <button 
              key={cat.id} 
              onClick={() => onCategoryChange?.(cat.id)}
              className="flex flex-col items-center space-y-2 min-w-[70px] relative group"
            >
              <div className={cn(
                "relative h-16 w-16 rounded-full overflow-hidden border-2 transition-all duration-300",
                isActive ? "border-primary ring-4 ring-primary/10 scale-105" : "border-transparent bg-muted/30"
              )}>
                <Image
                  src={cat.imageUrl || `https://picsum.photos/seed/${cat.id}/100/100`}
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
