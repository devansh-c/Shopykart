'use client';

import Script from 'next/script';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * @fileOverview Hardened Tawk.to visibility control for ShopyKart.
 * Forcefully hides on /cart path and during initial location selection phase.
 * Prevents console errors by tracking state and verifying API readiness.
 */
export function TawkChat() {
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const lastVisibilityRef = useRef<'hidden' | 'visible' | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const manageTawkVisibility = () => {
      const tawk = (window as any).Tawk_API;
      
      // Strict check: Only proceed if Tawk_API is fully ready and has expected functions
      if (tawk && typeof tawk.hide === 'function' && typeof tawk.show === 'function') {
        const isLocationSet = typeof window !== 'undefined' && localStorage.getItem('user_location_set') === 'true';
        const isCartPage = pathname?.startsWith('/cart');
        
        const shouldHide = isCartPage || !isLocationSet;
        const targetState = shouldHide ? 'hidden' : 'visible';

        // Only call if state actually needs to change to prevent Redundant/Logger errors
        if (lastVisibilityRef.current !== targetState) {
          try {
            if (shouldHide) {
              tawk.hide();
            } else {
              tawk.show();
            }
            lastVisibilityRef.current = targetState;
          } catch (e) {
            // Silent catch to prevent Tawk logger from bubbling up to UI as an error
          }
        }
      }
    };

    // Reduced polling frequency to 1200ms for stability
    const interval = setInterval(manageTawkVisibility, 1200);
    
    // Initial sync
    manageTawkVisibility();
    
    return () => clearInterval(interval);
  }, [pathname, isClient]);

  if (!isClient) return null;

  return (
    <Script id="tawk-script-direct" strategy="afterInteractive">
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
          // Verify if widget should be hidden immediately upon load
          var locSet = localStorage.getItem('user_location_set') === 'true';
          if (!locSet && Tawk_API.hide) {
            Tawk_API.hide();
          }
        };

        Tawk_API.customStyle = {
          visibility : {
            desktop : { xOffset : 15, yOffset : 25 },
            mobile : { xOffset : 15, yOffset : 100 }
          }
        };
      `}
    </Script>
  );
}
