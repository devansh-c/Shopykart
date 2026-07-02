'use client';

import { useEffect } from 'react';

/**
 * @fileOverview Tawk.to Live Chat Integration.
 * Optimized with native script injection for maximum reliability in preview environments.
 * Added yOffset to prevent the widget from being hidden behind the Bottom Navigation.
 */
export function TawkChat() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Prevent multiple script loads
    if (document.getElementById('tawk-script')) return;

    // Tawk.to standard initialization
    (window as any).Tawk_API = (window as any).Tawk_API || {};
    (window as any).Tawk_LoadStart = new Date();

    const s1 = document.createElement("script");
    const s0 = document.getElementsByTagName("script")[0];
    
    s1.id = 'tawk-script';
    s1.async = true;
    // Using the user's key: e3da7e12a118e3f5b38146a34fcc3bf34b82a96a
    s1.src = 'https://embed.tawk.to/e3da7e12a118e3f5b38146a34fcc3bf34b82a96a/default';
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
          'yOffset': 80 // Pushes the widget 80px up from the bottom
        }, function(error: any) {
          if (error) console.warn("Tawk.to Nudge Failed:", error);
        });
        console.log("Tawk.to Chat Widget: Active & Nudged Up ✅");
      } catch (e) {
        console.warn("Tawk.to API not ready for nudge.");
      }
    };

    return () => {
      // Clean up script on unmount if necessary (optional)
      const existing = document.getElementById('tawk-script');
      if (existing) existing.remove();
    };
  }, []);

  return null;
}
