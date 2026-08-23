'use client';

import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Mail, Phone, MapPin, ChevronRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Logo } from './Logo';
import { cn, slugify } from '@/lib/utils';

export function Footer() {
  const firestore = useFirestore();

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: settings } = useDoc<any>(brandingRef);

  const pagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'pages');
  }, [firestore]);
  const { data: pages } = useCollection<any>(pagesQuery);

  return (
    <footer className="w-full bg-[#0B0B0B] text-white pt-20 pb-10 px-6 rounded-t-[3rem] mt-10 relative overflow-hidden transform-gpu">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
        <div className="space-y-6">
          <Logo className="scale-110 !px-0 !bg-transparent !border-none !shadow-none" />
          <p className="text-gray-400 text-xs font-medium leading-relaxed max-w-xs uppercase tracking-wider">
            {settings?.footerAbout || 'Premium gourmet delivery service serving the best in town.'}
          </p>
        </div>

        <div className="space-y-6">
          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Assistance</h4>
          <ul className="space-y-4 text-[11px] font-bold text-gray-400">
            <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /> {settings?.contactEmail || 'ceo@shopykart.co.in'}</li>
            <li className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /> {settings?.contactPhone || '79920 90977'}</li>
            <li className="flex items-center gap-3"><MapPin className="h-4 w-4 text-primary" /> MAURANIPUR, UP</li>
          </ul>
        </div>

        <div className="space-y-6">
           <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">SEO Policies</h4>
           <ul className="space-y-3">
              {pages?.map((page: any) => (
                <li key={page.id}>
                  <Link href={`/page/${page.slug || slugify(page.title)}`} className="text-[10px] font-black text-gray-500 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2">
                    <ChevronRight className="h-2.5 w-2.5 text-primary" />
                    {page.title}
                  </Link>
                </li>
              ))}
              {!pages && ['Privacy Policy', 'Terms', 'Refunds'].map(l => (
                <li key={l} className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{l}</li>
              ))}
           </ul>
        </div>

        <div className="space-y-6">
           <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4">
              <div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-green-500" /><span className="text-[10px] font-black uppercase text-white">Trust Locked</span></div>
              <p className="text-[9px] font-bold text-gray-500 uppercase leading-relaxed">Identity and Payments secured by Google Cloud Infrastructure.</p>
           </div>
        </div>
      </div>
      <div className="mt-20 pt-8 border-t border-white/5 flex items-center justify-between text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">
        <p>{settings?.footerCopyright || '© 2024 ShopyKart'}</p>
        <span className="italic">Khatarnak SEO v2.0</span>
      </div>
    </footer>
  );
}
