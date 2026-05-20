
'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * @fileOverview BrandingLoader handles dynamic SEO and UI branding from Firestore.
 * Enhanced with stricter safety checks to prevent hydration and runtime errors.
 */
export function BrandingLoader() {
  const firestore = useFirestore();

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);

  const { data: branding } = useDoc<any>(brandingRef);

  useEffect(() => {
    if (typeof window === 'undefined' || !document || !document.head) return;

    let isMounted = true;

    const applyBranding = (data: any) => {
      if (!data || !isMounted) return;

      // 1. Update Document Title
      if (data.siteTitle && document.title !== data.siteTitle) {
        document.title = data.siteTitle;
      }

      // 2. Update Meta tags safely
      const updateMetaTag = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
        try {
          const element = document.querySelector(`meta[${attr}="${name}"]`);
          if (element) {
            if (element.getAttribute('content') !== content) {
              element.setAttribute('content', content);
            }
          }
        } catch (e) {}
      };

      if (data.siteDescription) {
        updateMetaTag('description', data.siteDescription);
        updateMetaTag('og:description', data.siteDescription, 'property');
      }

      if (data.siteTitle) {
        updateMetaTag('og:title', data.siteTitle, 'property');
      }

      // 3. Update Link tags (Favicons) safely
      const updateLinkTag = (rel: string, href: string) => {
        try {
          const elements = document.querySelectorAll(`link[rel*="${rel}"]`);
          if (elements.length > 0) {
            elements.forEach((el) => {
              const linkEl = el as HTMLLinkElement;
              if (linkEl && linkEl.href !== href) {
                linkEl.href = href;
              }
            });
          }
        } catch (e) {}
      };

      if (data.faviconUrl) {
        updateLinkTag('icon', data.faviconUrl);
        updateLinkTag('apple-touch-icon', data.faviconUrl);
      }
    };

    if (document.readyState === 'loading') {
      const handleLoad = () => applyBranding(branding);
      window.addEventListener('DOMContentLoaded', handleLoad);
      return () => {
        isMounted = false;
        window.removeEventListener('DOMContentLoaded', handleLoad);
      };
    } else {
      applyBranding(branding);
    }

    return () => {
      isMounted = false;
    };
  }, [branding]);

  return null;
}
