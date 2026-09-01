'use client';

import Script from 'next/script';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * @fileOverview Tawk.to visibility control with ultra-defensive error handling.
 * Prevents internal [Tawk/Logger] errors by debouncing and wrapping API calls.
 * Implements a global error suppressor to prevent Next.js Error Overlay for Tawk internal bugs.
 */
export function TawkChat() {
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const [isTawkReady, setIsTawkReady] = useState(false);
  const lastStateRef = useRef<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
      // 1. STRICT SUPPRESSION: Override console.error specifically for Tawk Logger noise
      const originalError = window.console.error;
      window.console.error = (...args) => {
        const msg = args[0];
        if (typeof msg === 'string' && (msg.includes('[Tawk/Logger]') || msg.includes('Tawk_API') || msg.includes('i18next'))) {
          return; // Ignore Tawk internal logs
        }
        originalError.apply(window.console, args);
      };

      // 2. GLOBAL ERROR SHIELD: Specifically catch and ignore Tawk-related runtime errors
      // This prevents the Next.js Red Screen of Death for third-party script bugs.
      const originalWindowError = window.onerror;
      window.onerror = function(message, source, lineno, colno, error) {
        const msg = String(message).toLowerCase();
        if (msg.includes('tawk') || msg.includes('i18next') || (source && source.includes('tawk.to'))) {
          console.debug('Suppressed Tawk internal error:', message);
          return true; // Prevents the error from propagating and triggering the overlay
        }
        if (originalWindowError) {
          return originalWindowError.apply(window, [message, source, lineno, colno, error]);
        }
        return false;
      };
    }

    // Signal for script load
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
    
    // Restricted routes: Business portals, checkout, and tracking
    const isRestrictedRoute = 
      path.startsWith('/admin') || 
      path.startsWith('/vendor') || 
      path.startsWith('/delivery') || 
      path.startsWith('/medical') || 
      path.startsWith('/beauty') ||
      path.includes('/cart') ||
      path.startsWith('/order/track'); 

    const locationSet = typeof window !== 'undefined' ? localStorage.getItem('user_location_set') === 'true' : false;
    
    const shouldShow = !isRestrictedRoute && locationSet;
    const newState = shouldShow ? 'show' : 'hide';

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
            // Silently ignore script internal errors
          }
        }
      };

      const timer = setTimeout(applyTawkState, 1500); // Increased debounce for stability
      return () => clearTimeout(timer);
    }
  }, [pathname, isClient, isTawkReady]);

  if (!isClient) return null;

  return (
    <>
      <Script id="tawk-setup" strategy="lazyOnload">
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
