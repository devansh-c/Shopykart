import { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';

/**
 * @fileOverview ShopyKart Main Entrance - Optimized for Instant Paint.
 * Removed blocking server-side fetches to ensure 0ms initial HTML response.
 */

export const metadata: Metadata = {
  title: 'Shopykart – 10 Min Veg Food Delivery | Order Online Mauranipur & Ranipur',
  description: 'Fastest 10-min gourmet veg food delivery in Mauranipur and Ranipur. Order pizzas, burgers, snacks and more at best prices.',
  openGraph: {
    title: 'Shopykart – Premium Food Delivery',
    description: '10-minute delivery in Mauranipur and Ranipur.',
    url: 'https://shopykart.co.in',
    siteName: 'ShopyKart',
    images: [{ url: 'https://shopykart.co.in/og-image.jpg' }],
    locale: 'en_IN',
    type: 'website',
  },
};

export default function ShopyKartApp() {
  // We no longer block on server-side Firestore calls. 
  // Components will use local fallbacks and fetch asynchronously in the background.
  return (
    <HomeClient />
  );
}
