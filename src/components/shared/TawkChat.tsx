
'use client';

import Script from 'next/script';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * @fileOverview Tawk.to visibility control with strict readiness tracking.
 * Prevents redundant calls and early API execution to eliminate [Tawk/Logger] errors.
 */
export function TawkChat() {
  const [isClient, setIsClient] = useState(false);
  const [isTawkReady, setIsTawkReady] = useState(false);
  const pathname = usePathname();
  const lastVisibilityRef = useRef<boolean | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const manageTawkVisibility = () => {
      const tawk = (window as any).Tawk_API;
      
      // Only proceed if Tawk is fully initialized and ready
      if (tawk && typeof tawk.hide === 'function' && typeof tawk.show === 'function') {
        const path = pathname?.toLowerCase() || '';
        
        // STRICT BLOCK: Hide on all location/map screens and business dashboards
        const isBusinessRoute = 
          path.startsWith('/admin') || 
          path.startsWith('/vendor') || 
          path.startsWith('/delivery') || 
          path.startsWith('/medical') || 
          path.startsWith('/beauty') ||
          path.startsWith('/cart'); 

        const locationSet = typeof window !== 'undefined' ? localStorage.getItem('user_location_set') === 'true' : true;
        const shouldHide = isBusinessRoute || !locationSet;

        // Only update if visibility changed to prevent Tawk Logger errors
        if (lastVisibilityRef.current !== shouldHide) {
          try {
            if (shouldHide) {
              tawk.hide();
            } else {
              tawk.show();
            }
            lastVisibilityRef.current = shouldHide;
          } catch (e) {
            console.debug('Tawk.to interaction silenced to prevent logger error');
          }
        }
      }
    };

    // Run check on interval to catch Tawk late loading
    const interval = setInterval(manageTawkVisibility, 1000);
    return () => clearInterval(interval);
  }, [pathname, isClient]);

  if (!isClient) return null;

  return (
    <>
      <Script id="tawk-setup" strategy="afterInteractive">
        {`
          var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();
          Tawk_API.onLoad = function() {
            window.dispatchEvent(new CustomEvent('tawk-ready'));
          };
          (function() {
            var s1 = document.createElement("script"),
                s0 = document.getElementsByTagName("script")[0];
            s1.async = true;
            s1.src = 'https://embed.tawk.to/6a32055016fcef1d436f9f9d/default';
            s1.charset = 'UTF-8';
            s1.setAttribute('crossorigin', '*');
            s0.parentNode.insertBefore(s1, s0);
          })();

          Tawk_API.customStyle = {
            visibility : {
              desktop : { xOffset : 15, yOffset : 25 },
              mobile : { xOffset : 15, yOffset : 100 }
            }
          };
        `}
      </Script>
    </>
  );
}
