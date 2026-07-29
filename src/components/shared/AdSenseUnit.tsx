'use client';

import { useEffect } from 'react';

/**
 * @fileOverview Custom AdSense Ad Unit component for ShopyKart.
 * Handles the specific 'Ghi' ad slot provided by the user.
 */
export default function AdSenseUnit() {
  useEffect(() => {
    try {
      // Pushing the ad to the window object safely
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.debug('AdSense unit still pending verification or blocked by browser.');
    }
  }, []);

  return (
    <div className="w-full px-4 py-4 flex justify-center overflow-hidden min-h-[100px]">
      <div className="w-full max-w-lg bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200 flex flex-col items-center">
        <span className="text-[7px] font-black text-gray-300 uppercase tracking-[0.5em] mt-2 mb-1">Sponsored Content</span>
        <ins className="adsbygoogle"
             style={{ display: 'block', width: '100%', minHeight: '90px' }}
             data-ad-client="ca-pub-3697085425178482"
             data-ad-slot="7496080702"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
}
