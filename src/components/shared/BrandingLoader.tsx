'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * @fileOverview BrandingLoader handles dynamic SEO updates from Firestore.
 * Ensures Title, Description, and Favicon are updated safely on the client.
 */
export function BrandingLoader() {
  const firestore = useFirestore();

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);

  const { data: branding } = useDoc<any>(brandingRef);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Update Document Title
    if (branding?.siteTitle) {
      document.title = branding.siteTitle;
    }

    // 2. Helper to update/create Meta tags
    const updateMetaTag = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    if (branding?.siteDescription) {
      updateMetaTag('description', branding.siteDescription);
      updateMetaTag('og:description', branding.siteDescription, 'property');
      updateMetaTag('twitter:description', branding.siteDescription);
    }

    if (branding?.siteTitle) {
      updateMetaTag('og:title', branding.siteTitle, 'property');
      updateMetaTag('twitter:title', branding.siteTitle);
    }

    // 3. Helper to update/create Link tags (Favicons)
    const updateLinkTag = (rel: string, href: string) => {
      // Remove any existing tags with this rel to avoid conflicts
      const existingTags = document.querySelectorAll(`link[rel*="${rel}"]`);
      existingTags.forEach(tag => tag.remove());

      const newLink = document.createElement('link');
      newLink.rel = rel;
      newLink.href = href;
      document.head.appendChild(newLink);
    };

    if (branding?.faviconUrl) {
      updateLinkTag('icon', branding.faviconUrl);
      updateLinkTag('apple-touch-icon', branding.faviconUrl);
      updateLinkTag('shortcut icon', branding.faviconUrl);
    } else {
      // Fallback to our custom SVG cart icon instead of default N
      const fallbackIcon = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛒</text></svg>';
      updateLinkTag('icon', fallbackIcon);
      updateLinkTag('shortcut icon', fallbackIcon);
    }
  }, [branding]);

  return null;
}
