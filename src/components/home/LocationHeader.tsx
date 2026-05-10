"use client"

import { MapPin, ChevronDown, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';

export function LocationHeader() {
  return (
    <div className="bg-primary px-4 pt-6 pb-4 rounded-b-[2.5rem] shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="text-[10px] font-medium text-white/80 uppercase tracking-widest">Deliver to</span>
              <ChevronDown className="h-3 w-3 text-white/80" />
            </div>
            <h2 className="text-sm font-bold text-white truncate max-w-[150px]">Times Square, NY</h2>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-2xl bg-white/10 text-white border border-white/10">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-amber-400 rounded-full border-2 border-primary" />
          </Button>
        </div>
      </div>

      <div className="flex justify-center py-2">
        <Logo className="scale-110" />
      </div>
    </div>
  );
}
