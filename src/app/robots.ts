import { MetadataRoute } from 'next';

/**
 * @fileOverview Dynamic Robots.txt generator for Next.js 15.
 * Optimized crawling paths for Googlebot discovery.
 * NOTE: Ensure src/app/robots.txt is deleted manually to avoid duplicate file errors.
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
