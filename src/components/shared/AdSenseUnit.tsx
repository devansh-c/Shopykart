'use client';

import { useEffect, useRef } from 'react';

/**
 * @fileOverview Custom AdSense Ad Unit component (Ghi Unit).
 * Verified from screenshot: slot 7496080702, pub-3697085425178482.
 * Fix: Added explicit status check to prevent "already have ads" TagError.
 */
export default function AdSenseUnit() {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadAd = () => {
      try {
        // Only push if the element exists and hasn't been processed by Google yet
        if (adRef.current && !adRef.current.hasAttribute('data-adsbygoogle-status')) {
          const adsbygoogle = (window as any).adsbygoogle || [];
          adsbygoogle.push({});
        }
      } catch (e) {
        // Silent catch for AdSense double-push warnings
        console.debug('AdSense Unit Status: Handled or Pending');
      }
    };

    // Small delay to ensure DOM is fully ready
    const timer = setTimeout(loadAd, 300);
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
