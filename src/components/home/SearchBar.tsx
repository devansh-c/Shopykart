"use client"

import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function SearchBar() {
  return (
    <div className="px-4 py-4 flex space-x-3">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search for your favorite food..." 
          className="pl-11 h-12 bg-white border-border/50 rounded-2xl soft-shadow focus-visible:ring-primary focus-visible:border-primary/50"
        />
      </div>
      <button className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
        <SlidersHorizontal className="h-5 w-5 text-primary-foreground" />
      </button>
    </div>
  );
}