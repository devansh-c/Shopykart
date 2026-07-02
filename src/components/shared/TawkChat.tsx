'use client';

import Script from 'next/script';

/**
 * @fileOverview Tawk.to Live Chat Integration.
 * Loads the chat widget for customer support using the provided API key.
 */
export function TawkChat() {
  return (
    <Script id="tawk-chat-script" strategy="afterInteractive">
      {`
        var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
        (function(){
          var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
          s1.async=true;
          s1.src='https://embed.tawk.to/e3da7e12a118e3f5b38146a34fcc3bf34b82a96a/default';
          s1.charset='UTF-8';
          s1.setAttribute('crossorigin','*');
          s0.parentNode.insertBefore(s1,s0);
        })();
      `}
    </Script>
  );
}
