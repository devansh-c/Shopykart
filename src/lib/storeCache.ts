import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  try {
    initializeApp();
  } catch (e) {
    console.log('Firebase Admin init fallback:', e);
  }
}

const db = getFirestore();

interface CacheContainer {
  data: any[];
  timestamp: number;
}

const globalCache = globalThis as unknown as {
  _shopykartProductsCache?: CacheContainer;
};

const TTL_MS = 1000 * 60 * 15; // 15 minutes auto refresh

export async function getCachedProducts() {
  const now = Date.now();

  if (globalCache._shopykartProductsCache && (now - globalCache._shopykartProductsCache.timestamp < TTL_MS)) {
    return globalCache._shopykartProductsCache.data;
  }

  try {
    const snapshot = await db.collection('products').get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    globalCache._shopykartProductsCache = {
      data: products,
      timestamp: now,
    };

    return products;
  } catch (error) {
    console.error('Error reading Firestore cache:', error);
    return globalCache._shopykartProductsCache ? globalCache._shopykartProductsCache.data : [];
  }
}

export function clearProductsCache() {
  globalCache._shopykartProductsCache = undefined;
}
