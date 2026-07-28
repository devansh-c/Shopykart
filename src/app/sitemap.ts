import { MetadataRoute } from 'next';

/**
 * @fileOverview Next.js Sitemap Generator.
 * Helps Google discover and index all public routes and products.
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

  // Note: For a fully dynamic production site, you would fetch 
  // all product and store slugs from Firestore here.
  // Example structure for crawlers:
  const productStructure = {
    url: `${baseUrl}/product/`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  };

  return [
    ...staticRoutes,
    productStructure,
  ];
}
