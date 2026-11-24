
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  MapPin, 
  ChevronRight, 
  Store, 
  Loader2, 
  ArrowLeft, 
  ShieldCheck,
  Navigation,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Dedicated Location Selection Page.
 * Replaces the popup system for a more premium and persistent experience.
 */
export default function SelectLocationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch Active Zones
  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'zones'), where('isActive', '==', true));
  }, [firestore]);

  const { data: activeZones, loading: zonesLoading } = useCollection<any>(zonesQuery, 'location_zones_v6');

  const filteredZones = useMemo(() => {
    if (!activeZones) return [];
    return activeZones.filter(z => 
      z.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeZones, searchQuery]);

  const handleZoneSelect = async (zone: any) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // 1. Save to LocalStorage for instant access
      localStorage.setItem('active_zone_id', zone.id);
      localStorage.setItem('user_city', zone.city || 'Local');
      localStorage.setItem('user_address', zone.name);
      localStorage.setItem('user_location_set', 'true');

      // 2. CRITICAL: Sync to Firestore Profile for persistence across app updates
      if (user && firestore) {
        await setDoc(doc(firestore, 'users', user.uid), {
          lastSelectedZone: zone.name,
          lastSelectedZoneId: zone.id,
          city: zone.city || 'Local',
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      toast({ 
        title: "Location Secured! ✅", 
        description: `Delivering to ${zone.name}.` 
      });

      // 3. Dispatch update event and redirect
      window.dispatchEvent(new CustomEvent('user-address-updated'));
      router.replace('/');
    } catch (err) {
      console.error("Location sync error:", err);
      // Still allow home access if Firestore fails but LocalStorage succeeded
      router.replace('/');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col transform-gpu">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-xl py-6 px-6 sticky top-0 z-[100] border-b border-gray-100 space-y-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 active:scale-90 transition-all border border-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-800" />
          </button>
          <div className="flex-1">
             <h1 className="text-xl font-black uppercase italic tracking-tighter text-gray-900 leading-none">Select Area</h1>
             <p className="text-[8px] font-black text-primary uppercase mt-1 tracking-widest">FOR 10-MIN GOURMET DELIVERY</p>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your city or colony..." 
            className="pl-12 h-14 bg-gray-50 border-none rounded-2xl shadow-inner font-bold text-base focus-visible:ring-1 focus-visible:ring-primary/20"
          />
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center gap-2 px-2">
           <Navigation className="h-4 w-4 text-primary" />
           <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Available Serving Zones</h2>
        </div>

        <div className="space-y-4">
          {zonesLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
               <Loader2 className="h-10 w-10 animate-spin text-primary" />
               <p className="text-[10px] font-black uppercase tracking-widest">Scanning local network...</p>
            </div>
          ) : filteredZones.length > 0 ? (
            filteredZones.map((zone: any) => (
              <button 
                key={zone.id} 
                onClick={() => handleZoneSelect(zone)}
                className="w-full bg-white p-6 rounded-[2.5rem] border-2 border-gray-50 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all hover:border-primary/30 hover:shadow-xl"
              >
                <div className="flex items-center gap-5 text-left">
                  <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all border border-gray-100 shadow-inner">
                    <Store className="h-7 w-7" />
                  </div>
                  <div>
                    <h4 className="font-black italic uppercase text-lg leading-none mb-1 text-gray-900 group-hover:text-primary transition-colors">{zone.name}</h4>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-gray-400 uppercase">{zone.city}</span>
                       <div className="h-1 w-1 bg-gray-200 rounded-full" />
                       <span className="text-[10px] font-black text-green-600 uppercase">10 MINS</span>
                    </div>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                   <ChevronRight className="h-5 w-5" />
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
               <MapPin className="h-12 w-12 mx-auto text-gray-200 mb-4" />
               <p className="text-gray-400 font-black italic uppercase tracking-widest text-sm px-10 leading-tight">No serving zones found<br />in this search</p>
            </div>
          )}
        </div>
      </main>

      <footer className="p-10 text-center opacity-30 mt-auto">
         <p className="text-[9px] font-black uppercase tracking-[0.4em]">ShopyKart Global Logistics</p>
      </footer>
    </div>
  );
}
