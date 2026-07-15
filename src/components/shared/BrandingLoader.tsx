'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * @fileOverview BrandingLoader dynamically updates SEO and Icons from Firestore.
 */
export default function BrandingLoader() {
  const firestore = useFirestore();

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);

  const { data: branding } = useDoc<any>(brandingRef);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Default Metadata from user requirements
    const defaultTitle = "Shopykart – 10 Min Veg Food Delivery|Mauranipur,Ranipur| Order Now";
    const defaultDesc = "Shopykart: Official 10-Min Veg Food Delivery! 🥗 Freshly Prepared | Best Prices | Open 10 AM - 8:15 PM. Verified Service by Shopykart";

    // 1. Update Site Title
    document.title = branding?.siteTitle || defaultTitle;

    // 2. Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', branding?.siteDescription || defaultDesc);

    // 3. Update Favicon
    if (branding?.faviconUrl) {
      const links = document.querySelectorAll("link[rel*='icon']");
      if (links.length > 0) {
        links.forEach(link => {
          (link as HTMLLinkElement).href = branding.faviconUrl;
        });
      } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = branding.faviconUrl;
        document.head.appendChild(link);
      }
    }
  }, [branding]);

  return null;
}
