'use client';

import { useEffect, useRef } from 'react';

/**
 * @fileOverview Custom AdSense Ad Unit component (Ghi Unit).
 * Verified from screenshot: slot 7496080702, pub-3697085425178482.
 */
export default function AdSenseUnit() {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && adRef.current) {
      try {
        // Prevent double-pushing ads into the same element
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
    <div className="w-full px-4 py-6 flex justify-center overflow-hidden min-h-[120px]">
      <div className="w-full max-w-lg bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center">
        <span className="text-[7px] font-black text-gray-300 uppercase tracking-[0.5em] mt-3 mb-2">Sponsored Content</span>
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
