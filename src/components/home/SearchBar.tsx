"use client"

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="px-4 py-4 flex space-x-3">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search for your favorite food..." 
          className="pl-11 pr-10 h-12 bg-white border-border/50 rounded-2xl soft-shadow focus-visible:ring-primary focus-visible:border-primary/50"
        />
        {value && (
          <button 
            onClick={() => onChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>
      <button className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
        <SlidersHorizontal className="h-5 w-5 text-primary-foreground" />
      </button>
    </div>
  );
}
