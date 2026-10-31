
'use client';

import Script from 'next/script';
import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

/**
 * @fileOverview Tawk.to visibility control with Deployed App Position Fix.
 * Fixed: Improved initialization sequence to eliminate [Tawk/Logger] errors.
 */
export function TawkChat() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [isTawkReady, setIsTawkReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Global ready listener setup
    if (typeof window !== 'undefined') {
      (window as any).Tawk_API = (window as any).Tawk_API || {};
      (window as any).Tawk_API.onLoad = function() {
        setIsTawkReady(true);
      };
    }
  }, []);

  const updateVisibility = useCallback(() => {
    if (typeof window === 'undefined' || !isTawkReady) return;

    const tawk = (window as any).Tawk_API;
    if (!tawk || typeof tawk.show !== 'function' || typeof tawk.hide !== 'function') return;

    const path = pathname?.toLowerCase() || '';
    const isRestrictedRoute = 
      path.startsWith('/admin') || 
      path.startsWith('/vendor') || 
      path.startsWith('/delivery') || 
      path.startsWith('/medical') || 
      path.startsWith('/beauty') ||
      path.includes('/cart') ||
      path.startsWith('/order/track'); 

    const locationSet = localStorage.getItem('user_location_set') === 'true';
    const shouldShow = !isRestrictedRoute && locationSet;

    // Small delay to ensure the widget's internal state is fully ready
    setTimeout(() => {
      try {
        if (shouldShow) {
          tawk.show();
        } else {
          tawk.hide();
        }
      } catch (e) {
        console.debug("Tawk visibility update silent fail");
      }
    }, 800);
  }, [pathname, isTawkReady]);

  useEffect(() => {
    updateVisibility();
  }, [updateVisibility]);

  if (!mounted) return null;

  return (
    <>
      <Script
        id="tawk-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            var Tawk_API = Tawk_API || {};
            Tawk_LoadStart = new Date();
            Tawk_API.customStyle = {
              visibility: {
                desktop: { xOffset: 20, yOffset: 40 },
                mobile: { xOffset: 20, yOffset: 110 }
              }
            };
          `,
        }}
      />
      <Script
        id="tawk-script"
        strategy="afterInteractive"
        src="https://embed.tawk.to/6a32055016fcef1d436f9f9d/default"
        onLoad={() => {
          // Fallback if onLoad inside Tawk_API didn't fire
          setTimeout(() => setIsTawkReady(true), 2000);
        }}
      />
    </>
  );
}
