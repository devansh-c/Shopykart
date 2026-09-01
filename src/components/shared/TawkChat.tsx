'use client';

import Script from 'next/script';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * @fileOverview Tawk.to visibility control with atomic state tracking.
 * Strictly prevents redundant API calls to eliminate [Tawk/Logger] console errors.
 * Added defensive timeout management to handle rapid navigation.
 */
export function TawkChat() {
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const [isTawkReady, setIsTawkReady] = useState(false);
  const lastStateRef = useRef<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Global signal for Tawk readiness
    (window as any).onTawkLoadSignal = () => {
      setIsTawkReady(true);
    };

    return () => {
      delete (window as any).onTawkLoadSignal;
    };
  }, []);

  useEffect(() => {
    if (!isClient || !isTawkReady) return;

    const tawk = (window as any).Tawk_API;
    if (!tawk) return;

    const path = pathname?.toLowerCase() || '';
    
    // STRICT BLOCK: Hide on business/logistics/checkout/specialized routes
    const isRestrictedRoute = 
      path.startsWith('/admin') || 
      path.startsWith('/vendor') || 
      path.startsWith('/delivery') || 
      path.startsWith('/medical') || 
      path.startsWith('/beauty') ||
      path.includes('/cart') ||
      path.startsWith('/order/track'); 

    const locationSet = typeof window !== 'undefined' ? localStorage.getItem('user_location_set') === 'true' : false;
    
    // widget logic: show only on customer frontend if location is set
    const shouldShow = !isRestrictedRoute && locationSet;
    const newState = shouldShow ? 'show' : 'hide';

    // ATOMIC CHECK & DEBOUNCE: Only call if state actually flips
    if (lastStateRef.current !== newState) {
      const applyTawkState = () => {
        const currentTawk = (window as any).Tawk_API;
        if (currentTawk && typeof currentTawk.show === 'function' && typeof currentTawk.hide === 'function') {
          try {
            if (shouldShow) {
              currentTawk.show();
            } else {
              currentTawk.hide();
            }
            lastStateRef.current = newState;
          } catch (e) {
            // Silently ignore Tawk internal state errors
          }
        }
      };

      const timer = setTimeout(applyTawkState, 600);
      return () => clearTimeout(timer);
    }
  }, [pathname, isClient, isTawkReady]);

  if (!isClient) return null;

  return (
    <>
      <Script id="tawk-setup" strategy="afterInteractive">
        {`
          var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();
          
          Tawk_API.onLoad = function() {
            if (window.onTawkLoadSignal) window.onTawkLoadSignal();
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
