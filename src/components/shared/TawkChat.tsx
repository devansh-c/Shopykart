'use client';

import { useEffect } from 'react';

/**
 * @fileOverview Tawk.to Live Chat Integration.
 * Updated: Nudged the widget higher (130px) to clear the Bottom Navigation and Profile button.
 */
export function TawkChat() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Prevent multiple script loads
    if (document.getElementById('tawk-script')) return;

    // Using Site ID from screenshot: 6a32055016fcef1d436f9f9d
    const propertyId = '6a32055016fcef1d436f9f9d';
    const widgetId = 'default';

    // Tawk.to standard initialization
    (window as any).Tawk_API = (window as any).Tawk_API || {};
    (window as any).Tawk_LoadStart = new Date();

    // Nudge the widget upward so it doesn't overlap with the Bottom Nav or Profile button
    (window as any).Tawk_API.onLoad = function() {
      try {
        // yOffset 130px ensures it clears the BottomNav (64px) + Safe Area (~34px) + Padding
        (window as any).Tawk_API.setAttributes({
          'yOffset': 130,
          'xOffset': 10 
        }, function(error: any) {
          if (error) console.warn("Tawk.to Nudge Failed:", error);
        });
        console.log("Tawk.to Chat Widget: Position Optimized ✅");
      } catch (e) {
        console.warn("Tawk.to API setup delay.");
      }
    };

    const s1 = document.createElement("script");
    const s0 = document.getElementsByTagName("script")[0];
    
    s1.id = 'tawk-script';
    s1.async = true;
    s1.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');

    if (s0 && s0.parentNode) {
      s0.parentNode.insertBefore(s1, s0);
    } else {
      document.head.appendChild(s1);
    }

    return () => {
      // Keep script alive to prevent widget disappearing on route change
    };
  }, []);

  return null;
}
