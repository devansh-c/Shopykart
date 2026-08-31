'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * @fileOverview Tawk.to visibility control.
 * Strictly hides the widget on all business/management routes.
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
        const path = pathname?.toLowerCase() || '';
        
        // STRICT BLOCK: Hide on all location/map screens and business dashboards
        const isBusinessRoute = 
          path.startsWith('/admin') || 
          path.startsWith('/vendor') || 
          path.startsWith('/delivery') || 
          path.startsWith('/medical/store') || 
          path.startsWith('/beauty/store') ||
          path.startsWith('/cart'); // Also hide on cart for map focus

        const locationSet = localStorage.getItem('user_location_set') === 'true';

        if (isBusinessRoute || !locationSet) {
          tawk.hide();
        } else {
          tawk.show();
        }
      }
    };

    // Run immediately and then on an interval to catch Tawk late loading
    manageTawkVisibility();
    const interval = setInterval(manageTawkVisibility, 2000);
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
