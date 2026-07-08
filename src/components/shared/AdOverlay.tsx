
'use client';

import { useState, useEffect } from 'react';
import { X, ExternalLink, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { usePathname } from 'next/navigation';
import { doc } from 'firebase/firestore';

/**
 * @fileOverview Interstitial Ad component for monetization.
 */
export default function AdOverlay() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();
  
  const [isVisible, setIsVisible] = useState(false);
  const [canClose, setCanClose] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fetch dynamic Ad settings from Firestore
  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: settings, loading: settingsLoading } = useDoc<any>(brandingRef);

  useEffect(() => {
    setMounted(true);
    const isCustomerPath = !pathname?.startsWith('/admin') && 
                           !pathname?.startsWith('/vendor') && 
                           !pathname?.startsWith('/delivery');
    
    if (!isCustomerPath) return;

    const shown = sessionStorage.getItem('shopykart_ad_shown');

    if (!shown && !userLoading && !settingsLoading && user && settings?.isAdEnabled !== false && settings?.adImageUrl) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        sessionStorage.setItem('shopykart_ad_shown', 'true');
        setTimeout(() => setCanClose(true), 2500);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [user, userLoading, settingsLoading, settings, pathname]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleLearnMore = () => {
    if (settings?.adLinkUrl) {
      window.open(settings.adLinkUrl, '_blank');
    }
  };

  if (!mounted || !isVisible || !settings?.adImageUrl) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/90 animate-in fade-in duration-500 backdrop-blur-md">
      <div className="relative w-full max-w-sm mx-4 aspect-[9/16] bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/20 flex flex-col group animate-in zoom-in-95 duration-500">
        <div className="relative flex-1">
          <img src={settings.adImageUrl} className="w-full h-full object-cover" alt="Sponsored" />
          <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-[8px] font-black text-white uppercase tracking-widest">Sponsored</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/60 to-transparent text-white">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-3">
              {settings.adTitle || 'Explore Quality.'}
            </h2>
            <p className="text-xs font-bold text-gray-300 uppercase tracking-widest leading-relaxed mb-6">
              {settings.adDescription || 'Discover premium offers and services in your city.'}
            </p>
            <button 
              onClick={handleLearnMore}
              className="w-full h-14 bg-primary rounded-2xl font-black uppercase italic tracking-tighter flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-primary/30"
            >
              LEARN MORE
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>
        <button 
          onClick={handleClose}
          disabled={!canClose}
          className={cn(
            "absolute top-6 right-6 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300",
            canClose 
              ? "bg-white text-black shadow-xl scale-100 opacity-100" 
              : "bg-white/10 text-transparent scale-50 opacity-0 pointer-events-none"
          )}
        >
          <X className="h-5 w-5" />
          {!canClose && <div className="absolute inset-0 border-2 border-white/20 rounded-full border-t-white animate-spin" />}
        </button>
      </div>
    </div>
  );
}
