import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { clearProductsCache } from '@/lib/storeCache';

export async function POST() {
  try {
    clearProductsCache();
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, message: 'In-memory cache purged and path revalidated' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
