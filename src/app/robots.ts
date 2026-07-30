import { MetadataRoute } from 'next';

/**
 * @fileOverview Dynamic Robots.txt generator for Next.js 15.
 * Optimizes crawling paths for Googlebot and other search engines.
 */
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
