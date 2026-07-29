
import { MetadataRoute } from 'next';

/**
 * @fileOverview Next.js Sitemap Generator.
 * Helps Google discover and index all public routes and products.
 * Optimized for full visibility and rapid discovery.
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
    '/delivery/login',
    '/vendor/login',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Pattern-based dynamic structures to guide crawlers even before dynamic fetch
  const dynamicCategories = [
    'product',
    'store',
    'page'
  ].map(type => ({
    url: `${baseUrl}/${type}/`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6
  }));

  return [
    ...staticRoutes,
    ...dynamicCategories,
  ];
}
