import { MetadataRoute } from 'next';

/**
 * @fileOverview Next.js Dynamic Sitemap Generator for Googlebot discovery.
 * Ensures full visibility of all content types with proper prioritization.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://shopykart.co.in';

  // Core static routes with high priority
  const staticRoutes = [
    '',
    '/menu',
    '/stores',
    '/orders',
    '/rewards',
    '/profile',
    '/wishlist',
    '/cart',
    '/services/coming-soon',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Business Portals (Less priority for indexing)
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

  // SEO Optimized Dynamic segments (Base patterns for discovery)
  const dynamicPatterns = [
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
    ...businessRoutes,
    ...dynamicPatterns,
  ];
}
