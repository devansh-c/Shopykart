"use client"

import { MapPin, ChevronDown, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LocationHeader() {
  return (
    <div className="flex items-center justify-between px-4 pt-6 pb-2">
      <div className="flex items-center space-x-2">
        <div className="bg-primary/10 p-2 rounded-2xl">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Deliver to</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </div>
          <h2 className="text-sm font-bold truncate max-w-[150px]">Times Square, NY</h2>
        </div>
      </div>
      
      <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-2xl bg-secondary/30 text-secondary-foreground border border-border/30">
        <Bell className="h-5 w-5" />
        <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full border-2 border-white" />
      </Button>
    </div>
  );
}