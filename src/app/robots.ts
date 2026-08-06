import { MetadataRoute } from 'next';

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