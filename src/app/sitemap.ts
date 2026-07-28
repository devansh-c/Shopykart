import { MetadataRoute } from 'next';

/**
 * @fileOverview Next.js Sitemap Generator.
 * Helps Google discover and index all public routes.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://shopykart.co.in';

  // Core static routes
  const staticRoutes = [
    '',
    '/menu',
    '/stores',
    '/orders',
    '/rewards',
    '/profile',
    '/wishlist',
    '/cart',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return [
    ...staticRoutes,
    // Add logic here to fetch dynamic product/store slugs if using SSR
  ];
}
