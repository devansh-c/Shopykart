
"use client"

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="px-4 -mt-7 relative z-10">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder='Search "b"' 
          className="pl-12 pr-10 h-14 bg-white border-none rounded-2xl shadow-xl shadow-black/10 text-lg focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {value && (
          <button 
            onClick={() => onChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
