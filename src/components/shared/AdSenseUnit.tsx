'use client';

import { useEffect, useRef } from 'react';

/**
 * @fileOverview Custom AdSense Ad Unit component (Ghi Unit).
 * Verified Slot: 7496080702, pub-3697085425178482.
 * High-reliability rendering with duplicate-push prevention.
 */
export default function AdSenseUnit() {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadAd = () => {
      try {
        // Only push if the element exists and hasn't been initialized by Google Ads script yet
        if (adRef.current && !adRef.current.hasAttribute('data-adsbygoogle-status')) {
          const adsbygoogle = (window as any).adsbygoogle || [];
          adsbygoogle.push({});
        }
      } catch (e) {
        // Silently handle AdSense errors to prevent red screen crash
        console.debug('AdSense Status: Unit handled or already active');
      }
    };

    // Delay to ensure Next.js has finished mounting the DOM properly
    const timer = setTimeout(loadAd, 500);
    return () => clearTimeout(timer);
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
