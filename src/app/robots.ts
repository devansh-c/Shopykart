
import { MetadataRoute } from 'next';

/**
 * @fileOverview Dynamic Robots.txt generator for Next.js 15.
 * Optimized crawling paths for Googlebot discovery.
 * Configuration: Strictly set to force-static for Next.js static export compatibility.
 */

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://shopykart.co.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/vendor/',
          '/delivery/',
          '/api/',
          '/cart/',
          '/wishlist/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/vendor/', '/delivery/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
