import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

/**
 * @fileOverview Highly optimized Sitemap for Shopykart.
 * Includes explicit priorities for critical routes and dynamic path patterns.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://shopykart.co.in';

  // Core static routes with high priority (Daily updates)
  const staticRoutes = [
    '',
    '/menu',
    '/stores',
    '/order/track',
    '/rewards',
    '/profile',
    '/wishlist',
    '/cart',
    '/services/coming-soon',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.9,
  }));

  // Business Portals (Less priority for indexing, Monthly updates)
  const businessRoutes = [
    '/admin/login',
    '/vendor/login',
    '/delivery/login',
    '/vendor/register',
    '/delivery/register',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.1,
  }));

  // SEO Optimized Dynamic segments patterns (Weekly updates)
  const dynamicPatterns = [
    'product',
    'store',
    'page'
  ].map(type => ({
    url: `${baseUrl}/${type}/`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7
  }));

  return [
    ...staticRoutes,
    ...businessRoutes,
    ...dynamicPatterns,
  ];
}
