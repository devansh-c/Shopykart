'use client';

import { useEffect } from 'react';

/**
 * @fileOverview Tawk.to Live Chat Integration.
 * Updated to use the correct Site ID (Property ID) from the user's dashboard.
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

    // Nudge the widget position upward so it doesn't overlap with the Bottom Nav
    (window as any).Tawk_API.onLoad = function() {
      try {
        (window as any).Tawk_API.setAttributes({
          'yOffset': 80 
        }, function(error: any) {
          if (error) console.warn("Tawk.to Nudge Failed:", error);
        });
        console.log("Tawk.to Chat Widget: Active with correct Site ID ✅");
      } catch (e) {
        console.warn("Tawk.to API setup delay.");
      }
    };

    return () => {
      // Keep script alive to prevent widget disappearing on route change
    };
  }, []);

  return null;
}
