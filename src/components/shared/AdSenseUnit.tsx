'use client';

import { useEffect, useRef } from 'react';

/**
 * @fileOverview Custom AdSense Ad Unit component for ShopyKart.
 * Fixed: Added status check to prevent "Already have ads" push error during React re-renders.
 */
export default function AdSenseUnit() {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    // Ensuring code only runs on client and once per mount
    if (typeof window !== 'undefined' && adRef.current) {
      try {
        // Check if AdSense has already processed this tag to prevent duplicate push errors
        const isProcessed = adRef.current.getAttribute('data-adsbygoogle-status');
        
        if (!isProcessed) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        }
      } catch (e) {
        console.debug('AdSense unit handled or pending:', e);
      }
    }
  }, []);

  return (
    <div className="w-full px-4 py-4 flex justify-center overflow-hidden min-h-[100px]">
      <div className="w-full max-w-lg bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200 flex flex-col items-center">
        <span className="text-[7px] font-black text-gray-300 uppercase tracking-[0.5em] mt-2 mb-1">Sponsored Content</span>
        <ins ref={adRef}
             className="adsbygoogle"
             style={{ display: 'block', width: '100%', minHeight: '90px' }}
             data-ad-client="ca-pub-3697085425178482"
             data-ad-slot="7496080702"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
}
