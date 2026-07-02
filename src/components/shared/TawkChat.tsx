'use client';

import Script from 'next/script';

/**
 * @fileOverview Tawk.to Live Chat Integration.
 * Optimized with standard Next.js script loading for maximum reliability.
 */
export function TawkChat() {
  return (
    <Script 
      id="tawk-chat-script"
      src="https://embed.tawk.to/e3da7e12a118e3f5b38146a34fcc3bf34b82a96a/default"
      strategy="afterInteractive" 
      onLoad={() => {
        console.log("Tawk.to Chat Widget: Loaded Successfully ✅");
      }}
    />
  );
}
