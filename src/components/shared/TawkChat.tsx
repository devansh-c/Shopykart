'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

/**
 * @fileOverview Tawk.to live chat implementation for ShopyKart.
 * Hardened to prevent [Tawk/Logger] errors and ensure single load.
 */
export function TawkChat() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
