'use client';

import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Instagram, Facebook, Twitter, MessageCircle, Mail, Phone, MapPin, ChevronRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Premium Dynamic Footer Component.
 * Fetches data from Firestore branding settings for real-time control.
 */
export function Footer() {
  const firestore = useFirestore();

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);

  const { data: settings } = useDoc<any>(brandingRef);

  const socials = [
    { id: 'insta', icon: Instagram, url: settings?.instagramUrl, color: 'hover:text-pink-500' },
    { id: 'fb', icon: Facebook, url: settings?.facebookUrl, color: 'hover:text-blue-600' },
    { id: 'twitter', icon: Twitter, url: settings?.twitterUrl, color: 'hover:text-sky-400' },
    { id: 'whatsapp', icon: MessageCircle, url: settings?.whatsappUrl, color: 'hover:text-green-500' },
  ].filter(s => !!s.url);

  return (
    <footer className="w-full bg-[#0B0B0B] text-white pt-20 pb-10 px-6 rounded-t-[3rem] mt-10 relative overflow-hidden transform-gpu">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
        
        {/* Brand Column */}
        <div className="space-y-6">
          <Logo className="scale-110 !px-0 !bg-transparent !border-none !shadow-none !backdrop-blur-none" />
          <p className="text-gray-400 text-xs font-medium leading-relaxed max-w-xs uppercase tracking-wider">
            {settings?.footerAbout || 'Premium food delivery service serving the best gourmet meals in your city.'}
          </p>
          <div className="flex items-center gap-4">
            {socials.map((social) => (
              <a 
                key={social.id} 
                href={social.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={cn(
                  "h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 active:scale-90",
                  social.color
                )}
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Support Column */}
        <div className="space-y-6">
          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Assistance</h4>
          <ul className="space-y-4">
            <li>
              <a href={`mailto:${settings?.contactEmail || 'support@shopykart.co.in'}`} className="flex items-center gap-3 group">
                <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-white transition-colors"><Mail className="h-4 w-4" /></div>
                <span className="text-[11px] font-bold text-gray-400 group-hover:text-white transition-colors">{settings?.contactEmail || 'support@shopykart.co.in'}</span>
              </a>
            </li>
            <li>
              <a href={`tel:${settings?.contactPhone || '7992090977'}`} className="flex items-center gap-3 group">
                <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-white transition-colors"><Phone className="h-4 w-4" /></div>
                <span className="text-[11px] font-bold text-gray-400 group-hover:text-white transition-colors">{settings?.contactPhone || '79920 90977'}</span>
              </a>
            </li>
            <li className="flex items-center gap-3 group">
              <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500"><MapPin className="h-4 w-4" /></div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{localStorage.getItem('user_city') || 'MAURANIPUR, UP'}</span>
            </li>
          </ul>
        </div>

        {/* Operations Column */}
        <div className="space-y-6">
           <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Company</h4>
           <ul className="space-y-3">
              {['About Us', 'Privacy Policy', 'Terms of Service', 'Cancellation Policy'].map((link) => (
                <li key={link}>
                  <Link href="/profile" className="text-[10px] font-black text-gray-500 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2">
                    <ChevronRight className="h-2.5 w-2.5 text-primary" />
                    {link}
                  </Link>
                </li>
              ))}
           </ul>
        </div>

        {/* Security Badge Column */}
        <div className="space-y-6">
           <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                 <ShieldCheck className="h-6 w-6 text-green-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-white">Trust & Safety</span>
              </div>
              <p className="text-[9px] font-bold text-gray-500 uppercase leading-relaxed">
                Aapka data aur payments 100% secure hain. Hum bank-grade encryption use karte hain.
              </p>
              <div className="pt-2">
                 <span className="bg-green-500/20 text-green-500 text-[8px] font-black px-2 py-1 rounded border border-green-500/20 uppercase">SECURED BY GOOGLE</span>
              </div>
           </div>
        </div>
      </div>

      <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">
          {settings?.footerCopyright || '© 2024 ShopyKart Private Limited'}
        </p>
        <div className="flex items-center gap-3">
           <div className="h-1 w-1 bg-gray-800 rounded-full" />
           <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest italic">Quality First Delivery Network</span>
           <div className="h-1 w-1 bg-gray-800 rounded-full" />
        </div>
      </div>
    </footer>
  );
}
