
'use client';

import Script from 'next/script';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * @fileOverview Tawk.to visibility control and custom positioning.
 * Hydration safe: Script is always present in the tree, visibility logic runs after mount.
 */
export function TawkChat() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [isTawkReady, setIsTawkReady] = useState(false);
  const lastStateRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
    (window as any).onTawkLoadSignal = () => {
      // POSITION FIX: Lift the widget to avoid overlapping with Bottom Nav
      if ((window as any).Tawk_API) {
        (window as any).Tawk_API.customStyle = {
          visibility: {
            desktop: { xOffset: 20, yOffset: 120 },
            mobile: { xOffset: 15, yOffset: 110 }
          }
        };
      }
      setIsTawkReady(true);
    };
    return () => { delete (window as any).onTawkLoadSignal; };
  }, []);

  useEffect(() => {
    if (!mounted || !isTawkReady || typeof window === 'undefined') return;

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
    const newState = shouldShow ? 'show' : 'hide';

    if (lastStateRef.current !== newState) {
      const timer = setTimeout(() => {
        try {
          if (shouldShow) tawk.show();
          else tawk.hide();
          lastStateRef.current = newState;
        } catch (e) {}
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [pathname, mounted, isTawkReady]);

  return (
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
      `}
    </Script>
  );
}
