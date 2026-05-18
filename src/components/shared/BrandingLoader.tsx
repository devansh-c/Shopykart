
'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function BrandingLoader() {
  const firestore = useFirestore();

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);

  const { data: branding } = useDoc<any>(brandingRef);

  useEffect(() => {
    if (branding) {
      // Update Title
      if (branding.siteTitle) {
        document.title = branding.siteTitle;
      }

      // Update Description Meta Tag
      if (branding.siteDescription) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', branding.siteDescription);
      }

      // Update Favicon
      if (branding.faviconUrl) {
        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon) {
          favicon.setAttribute('href', branding.faviconUrl);
        } else {
          const newFavicon = document.createElement('link');
          newFavicon.rel = 'icon';
          newFavicon.href = branding.faviconUrl;
          document.head.appendChild(newFavicon);
        }

        // Also update apple-touch-icon
        const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
        if (appleIcon) {
          appleIcon.setAttribute('href', branding.faviconUrl);
        }
      }
    }
  }, [branding]);

  return null;
}
