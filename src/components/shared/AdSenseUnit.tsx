'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * @fileOverview Custom AdSense Ad Unit component with CLS Prevention.
 * Verified Slot: 7496080702, pub-3697085425178482.
 * High-reliability rendering with layout stability (min-height).
 */
export default function AdSenseUnit() {
  const adRef = useRef<HTMLModElement>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadAd = () => {
      try {
        if (adRef.current && !adRef.current.hasAttribute('data-adsbygoogle-status')) {
          const adsbygoogle = (window as any).adsbygoogle || [];
          adsbygoogle.push({});
          setHasLoaded(true);
        }
      } catch (e) {
        console.debug('AdSense Status: Unit handled or already active');
      }
    };

    const timer = setTimeout(loadAd, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full px-4 py-6 flex justify-center overflow-hidden min-h-[140px]">
      <div className="w-full max-w-lg bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center relative">
        {/* Placeholder UI to minimize layout shift and signal value to crawlers */}
        {!hasLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
             <Sparkles className="h-5 w-5 text-gray-300 mb-2 animate-pulse" />
             <span className="text-[7px] font-black text-gray-300 uppercase tracking-[0.4em]">Sponsored Placement</span>
          </div>
        )}
        
        <ins ref={adRef}
             className="adsbygoogle"
             style={{ display: 'block', width: '100%', minHeight: '110px' }}
             data-ad-client="ca-pub-3697085425178482"
             data-ad-slot="7496080702"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
}