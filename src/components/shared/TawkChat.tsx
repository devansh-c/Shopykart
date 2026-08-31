'use client';

import Script from 'next/script';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * @fileOverview Tawk.to visibility control with atomic state tracking.
 * Strictly prevents redundant API calls to eliminate [Tawk/Logger] console errors.
 */
export function TawkChat() {
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const lastVisibilityRef = useRef<boolean | null>(null);
  const [isTawkReady, setIsTawkReady] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Bind to Tawk global ready event if possible
    const checkInterval = setInterval(() => {
      if ((window as any).Tawk_API && typeof (window as any).Tawk_API.hide === 'function') {
        setIsTawkReady(true);
        clearInterval(checkInterval);
      }
    }, 1000);
    return () => clearInterval(checkInterval);
  }, []);

  useEffect(() => {
    if (!isClient || !isTawkReady) return;

    const manageTawkVisibility = () => {
      const tawk = (window as any).Tawk_API;
      
      if (tawk && typeof tawk.hide === 'function' && typeof tawk.show === 'function') {
        const path = pathname?.toLowerCase() || '';
        
        // STRICT BLOCK: Hide on business/logistics/cart routes
        const isRestrictedRoute = 
          path.startsWith('/admin') || 
          path.startsWith('/vendor') || 
          path.startsWith('/delivery') || 
          path.startsWith('/medical') || 
          path.startsWith('/beauty') ||
          path.includes('/cart') ||
          path.startsWith('/order/track'); 

        const locationSet = localStorage.getItem('user_location_set') === 'true';
        const shouldHide = isRestrictedRoute || !locationSet;

        // ATOMIC CHECK: Only call if state actually flips to avoid redundant Logger triggers
        if (lastVisibilityRef.current !== shouldHide) {
          try {
            if (shouldHide) {
              tawk.hide();
            } else {
              tawk.show();
            }
            lastVisibilityRef.current = shouldHide;
          } catch (e) {
            // Silently handle any initialization races
          }
        }
      }
    };

    manageTawkVisibility();
    // Re-check after a small delay to catch late loads
    const timer = setTimeout(manageTawkVisibility, 1500);
    return () => clearTimeout(timer);
  }, [pathname, isClient, isTawkReady]);

  if (!isClient) return null;

  return (
    <>
      <Script id="tawk-setup" strategy="afterInteractive">
        {`
          var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();
          (function() {
            var s1 = document.createElement("script"),
                s0 = document.getElementsByTagName("script")[0];
            s1.async = true;
            s1.src = 'https://embed.tawk.to/6a32055016fcef1d436f9f9d/default';
            s1.charset = 'UTF-8';
            s1.setAttribute('crossorigin', '*');
            s0.parentNode.insertBefore(s1, s0);
          })();

          Tawk_API.onLoad = function() {
            // Internal ready signal can be used here too
          };

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
