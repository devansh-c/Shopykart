"use client"

import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Megaphone, Info, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

/**
 * @fileOverview Persistent Announcement Banner for Customers.
 */
export default function AnnouncementBanner() {
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const announcementRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'announcement');
  }, [firestore]);

  const { data: announcement } = useDoc<any>(announcementRef);

  if (!mounted || !announcement || !announcement.isActive || !announcement.message) return null;

  const type = announcement.type || 'info';
  
  const typeStyles = {
    info: {
      container: "bg-blue-50 border-blue-100 text-blue-900 shadow-blue-100/30",
      iconBox: "bg-blue-100 text-blue-600",
      icon: Info
    },
    warning: {
      container: "bg-amber-50 border-amber-100 text-amber-900 shadow-amber-100/30",
      iconBox: "bg-amber-100 text-amber-600",
      icon: AlertTriangle
    },
    success: {
      container: "bg-green-50 border-green-100 text-green-900 shadow-green-100/30",
      iconBox: "bg-green-100 text-green-600",
      icon: CheckCircle2
    },
    error: {
      container: "bg-red-50 border-red-100 text-red-900 shadow-red-100/30",
      iconBox: "bg-red-100 text-red-600",
      icon: AlertCircle
    }
  };

  const style = typeStyles[type as keyof typeof typeStyles] || typeStyles.info;
  const Icon = style.icon;

  return (
    <div className="px-4 py-3 animate-in slide-in-from-top-4 duration-700">
      <div className={cn(
        "rounded-[1.75rem] border-2 p-5 shadow-xl relative overflow-hidden flex items-start gap-4 transition-all duration-500 transform-gpu",
        style.container
      )}>
        {/* Subtle motion background */}
        <div className="absolute top-0 right-0 h-full w-24 bg-white/10 -skew-x-12 translate-x-12 pointer-events-none" />

        <div className={cn(
          "p-2.5 rounded-xl shrink-0 shadow-inner border border-white/20",
          style.iconBox
        )}>
          <Icon className="h-6 w-6 animate-pulse" />
        </div>
        
        <div className="flex-1 min-w-0 pr-2 pt-0.5">
          {announcement.title && (
            <h4 className="text-sm font-black uppercase italic tracking-tighter leading-none mb-1.5">
              {announcement.title}
            </h4>
          )}
          <p className="text-[11px] font-bold opacity-90 leading-relaxed uppercase tracking-tight italic">
            {announcement.message}
          </p>
        </div>

        {/* Persistent Alert: No close button as requested by Admin */}
      </div>
    </div>
  );
}
