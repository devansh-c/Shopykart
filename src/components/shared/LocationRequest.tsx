
'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  Search, 
  Loader2, 
  CheckCircle2, 
  Map as MapIcon, 
  Navigation,
  Sparkles,
  Building2,
  ChevronRight,
  Globe
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogOverlay } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Mandatory Location Picker.
 * Opens automatically every time the app loads/refreshes.
 */
export function LocationRequest() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch active zones from Admin Panel
  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'zones'), where('isActive', '==', true));
  }, [firestore]);

  const { data: zones, loading: zonesLoading } = useCollection<any>(zonesQuery);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // FORCE OPEN EVERY TIME THE APP LOADS
    // This satisfies the "jitni baar open ho har baar ye page open ho" requirement.
    const timer = setTimeout(() => {
      setOpen(true);
    }, 500); // Slight delay for smoother entry after splash

    const handleOpen = () => {
      setSearchQuery('');
      setOpen(true);
    };

    window.addEventListener('open-location-picker', handleOpen);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('open-location-picker', handleOpen);
    };
  }, []);

  const filteredZones = useMemo(() => {
    if (!zones) return [];
    if (!searchQuery.trim()) return zones;
    
    const q = searchQuery.toLowerCase();
    return zones.filter(zone => 
      zone.name?.toLowerCase().includes(q) || 
      zone.city?.toLowerCase().includes(q) ||
      (zone.pincodes && Array.isArray(zone.pincodes) && zone.pincodes.some((p: string) => p.includes(q)))
    );
  }, [zones, searchQuery]);

  const handleSelectZone = async (zone: any) => {
    setIsProcessing(true);
    
    const lat = zone.boundary?.[0]?.lat || 25.2443;
    const lng = zone.boundary?.[0]?.lng || 79.0838;
    const pincode = zone.pincodes?.[0] || '';

    if (typeof window !== 'undefined') {
      localStorage.setItem('user_address', zone.name);
      localStorage.setItem('user_full_precise_address', `${zone.name}, ${zone.city}`);
      localStorage.setItem('user_city', zone.city || 'Local');
      localStorage.setItem('user_pincode', pincode);
      localStorage.setItem('user_location_set', 'true');
      localStorage.setItem('user_plus_code', `${lat},${lng}`);
      localStorage.setItem('active_zone_id', zone.id);
      window.dispatchEvent(new CustomEvent('user-address-updated'));
    }

    if (user && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
        address: zone.name,
        fullAddress: `${zone.name}, ${zone.city}`,
        city: zone.city || 'Local',
        pincode: pincode,
        plusCode: `${lat},${lng}`,
        updatedAt: serverTimestamp(),
      }, { merge: true }).catch(() => {});
    }

    setTimeout(() => {
      setIsProcessing(false);
      setOpen(false);
      toast({ title: `Location set to ${zone.name}`, description: "Showing stores available in your area." });
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogOverlay className="z-[2000] bg-black/60 backdrop-blur-sm" />
      <DialogContent className="rounded-t-[2.5rem] sm:rounded-[2.5rem] max-w-full sm:max-w-md border-none shadow-2xl overflow-hidden bg-white p-0 focus:outline-none flex flex-col sm:bottom-auto bottom-0 top-auto translate-y-0 sm:translate-y-[-50%] transition-all duration-500 z-[2001]">
        <div className="px-8 py-10">
          <div className="flex flex-col space-y-8">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="h-16 w-16 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mb-2 shadow-inner border border-primary/5">
                <MapPin className="h-8 w-8" />
              </div>
              <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-black leading-none">
                DELIVERY <span className="text-primary">AREA.</span>
              </DialogTitle>
              <DialogDescription className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                Select your service zone to continue
              </DialogDescription>
            </div>

            <div className="space-y-6">
               <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Search your city or area..." 
                    className="h-14 rounded-2xl bg-gray-50 border-none pl-12 font-bold focus-visible:ring-1 focus-visible:ring-primary/20 text-sm shadow-inner"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>

               <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar pb-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Available Serving Zones</p>
                  
                  {zonesLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-30">
                       <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                       <span className="text-[8px] font-black uppercase tracking-widest">Loading Zones...</span>
                    </div>
                  ) : filteredZones.length > 0 ? (
                    filteredZones.map((zone) => (
                      <button 
                        key={zone.id} 
                        disabled={isProcessing}
                        onClick={() => handleSelectZone(zone)}
                        className="w-full text-left p-5 rounded-[1.8rem] bg-gray-50/50 hover:bg-primary/5 flex items-center justify-between border-2 border-transparent hover:border-primary/10 transition-all group active:scale-[0.98]"
                      >
                         <div className="flex items-center gap-4 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary shrink-0">
                               <Navigation className="h-5 w-5 group-hover:animate-pulse" />
                            </div>
                            <div className="min-w-0">
                               <p className="text-sm font-black text-gray-800 leading-tight mb-0.5 truncate uppercase italic">{zone.name}</p>
                               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter truncate">{zone.city} • Pincode served</p>
                            </div>
                         </div>
                         <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors" />
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-12 px-6 bg-gray-50 rounded-[2.5rem] border border-dashed">
                       <Globe className="h-10 w-10 mx-auto text-gray-200 mb-3" />
                       <p className="text-[11px] font-black uppercase text-gray-400 tracking-tighter">No zones found matching "{searchQuery}"</p>
                       <p className="text-[8px] font-bold text-gray-300 uppercase mt-1">We are expanding to more areas soon!</p>
                    </div>
                  )}
               </div>
            </div>
            
            <div className="bg-primary/5 p-4 rounded-2xl flex items-center justify-center gap-3">
               <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
               <p className="text-[9px] text-primary font-black uppercase tracking-widest text-center">
                  Select a zone to unlock local stores
               </p>
            </div>
          </div>
        </div>

        {isProcessing && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
             <div className="relative">
                <div className="h-20 w-20 bg-primary rounded-[2rem] animate-bounce flex items-center justify-center shadow-2xl shadow-primary/20">
                   <span className="text-white text-3xl font-black italic">!</span>
                </div>
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mt-6">Switching Area...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
