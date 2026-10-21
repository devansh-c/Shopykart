'use client';

import Script from 'next/script';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * @fileOverview Tawk.to visibility control with Deployed App Position Fix.
 * Fixed: Resolved [Tawk/Logger] errors by streamlining initialization.
 */
export function TawkChat() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [isTawkReady, setIsTawkReady] = useState(false);

  useEffect(() => {
    setMounted(true);
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

    // Use a small timeout to ensure the widget is ready to accept commands
    const timer = setTimeout(() => {
      try {
        if (shouldShow) {
          tawk.show();
        } else {
          tawk.hide();
        }
      } catch (e) {}
    }, 1000);

    return () => clearTimeout(timer);
  }, [pathname, mounted, isTawkReady]);

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
                mobile: { xOffset: 20, yOffset: 90 }
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
          setIsTawkReady(true);
        }}
      />
    </>
  );
}
