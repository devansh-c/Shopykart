'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * @fileOverview BrandingLoader handles dynamic SEO updates from Firestore.
 * It ensures Title, Description, and Favicon are updated across the app
 * to maintain consistent branding and search engine visibility.
 */
export function BrandingLoader() {
  const firestore = useFirestore();

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);

  const { data: branding } = useDoc<any>(brandingRef);

  useEffect(() => {
    if (branding) {
      // 1. Update Document Title (Primary SEO)
      if (branding.siteTitle) {
        document.title = branding.siteTitle;
      }

      // 2. Update Description Meta Tag (For Google Snippets)
      const updateMetaTag = (name: string, content: string) => {
        let element = document.querySelector(`meta[name="${name}"]`);
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute('name', name);
          document.head.appendChild(element);
        }
        element.setAttribute('content', content);
      };

      if (branding.siteDescription) {
        updateMetaTag('description', branding.siteDescription);
        updateMetaTag('og:description', branding.siteDescription);
        updateMetaTag('twitter:description', branding.siteDescription);
      }

      // 3. Update OG Title and Twitter Card Title
      if (branding.siteTitle) {
        updateMetaTag('og:title', branding.siteTitle);
        updateMetaTag('twitter:title', branding.siteTitle);
      }

      // 4. Update Favicon Dynamically
      if (branding.faviconUrl) {
        const updateLinkTag = (rel: string, href: string) => {
          let link = document.querySelector(`link[rel*="${rel}"]`);
          if (link) {
            link.setAttribute('href', href);
          } else {
            const newLink = document.createElement('link');
            newLink.rel = rel;
            newLink.href = href;
            document.head.appendChild(newLink);
          }
        };

        updateLinkTag('icon', branding.faviconUrl);
        updateLinkTag('apple-touch-icon', branding.faviconUrl);
        updateLinkTag('shortcut icon', branding.faviconUrl);
      }
    }
  }, [branding]);

  return null;
}
