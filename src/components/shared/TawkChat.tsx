'use client';

import Script from 'next/script';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * @fileOverview Tawk.to visibility control.
 * Simplified to allow widget visibility as soon as possible.
 */
export function TawkChat() {
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const manageTawkVisibility = () => {
      const tawk = (window as any).Tawk_API;
      if (tawk && typeof tawk.hide === 'function' && typeof tawk.show === 'function') {
        const isCartPage = pathname?.startsWith('/cart');
        if (isCartPage) {
          tawk.hide();
        } else {
          tawk.show();
        }
      }
    };

    const interval = setInterval(manageTawkVisibility, 1500);
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
