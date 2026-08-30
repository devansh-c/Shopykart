'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * @fileOverview Tawk.to live chat implementation for ShopyKart.
 * Hardened to prevent [Tawk/Logger] errors and handle SPA visibility.
 */
export function TawkChat() {
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle SPA Visibility: Hide on checkout/cart
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Tawk_API) {
      const tawk = (window as any).Tawk_API;
      if (tawk.onLoad) {
        if (pathname?.startsWith('/cart')) {
          tawk.hide();
        } else {
          tawk.show();
        }
      } else {
        // If API is not fully ready, try again after a small delay
        tawk.onLoad = function() {
          if (pathname?.startsWith('/cart')) {
            tawk.hide();
          } else {
            tawk.show();
          }
        };
      }
    }
  }, [pathname]);

  if (!isClient) return null;

  return (
    <>
      <Script id="tawk-script-config" strategy="afterInteractive">
        {`
          var Tawk_API = Tawk_API || {};
          var Tawk_LoadStart = new Date();
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
              desktop : {
                xOffset : 15,
                yOffset : 25
              },
              mobile : {
                xOffset : 15,
                yOffset : 100
              }
            }
          };
        `}
      </Script>
    </>
  );
}
