'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Loader2, 
  CheckCircle2, 
  ChevronLeft, 
  Building2, 
  X, 
  Home, 
  PlusCircle, 
  LocateFixed, 
  AlertCircle, 
  Search, 
  Sparkles,
  Map as MapIcon,
  Globe
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ViewState = 'prompt' | 'manual' | 'searching';

export function LocationRequest() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ViewState>('prompt');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [manualData, setManualData] = useState({
    pincode: '',
    state: 'Uttar Pradesh',
    city: '',
    address: '',
    apartment: '',
    plusCode: ''
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Auto-prompt only if no location is set
    const hasLocation = localStorage.getItem('user_location_set');
    if (!hasLocation && user) {
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }

    const handleOpen = () => {
      setView('prompt');
      setOpen(true);
    };

    window.addEventListener('open-location-picker', handleOpen);
    return () => window.removeEventListener('open-location-picker', handleOpen);
  }, [user]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 3) {
        handleSearch(searchQuery);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = async (query: string) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' Ranipur Mauranipur Uttar Pradesh')}&addressdetails=1&limit=5`);
      const data = await res.json();
      setSearchResults(data);
    } catch (e) {
      console.warn("Search error:", e);
    }
  };

  const selectSearchResult = (item: any) => {
    const addr = item.address;
    const city = addr.city || addr.town || addr.village || '';
    const pincode = addr.postcode || '';
    
    setManualData({
      ...manualData,
      address: item.display_name,
      city: city,
      pincode: pincode,
      plusCode: `${item.lat},${item.lon}`
    });
    setView('manual');
    setSearchResults([]);
    setSearchQuery('');
  };

  const saveLocationToDB = async (location: any) => {
    let detectedTown = '';
    const fullAddrLower = (location.address || '').toLowerCase();
    
    if (fullAddrLower.includes('ranipur') || location.pincode === '284205') {
      detectedTown = 'Ranipur';
    } else if (fullAddrLower.includes('mauranipur') || location.pincode === '284204') {
      detectedTown = 'Mauranipur';
    }

    const servingTown = detectedTown || 'Local Area';
    const addressParts = location.address.split(',');
    const precisePart = addressParts[0].trim();
    const displayAddress = detectedTown 
      ? `${precisePart}, ${detectedTown}` 
      : precisePart;

    if (typeof window !== 'undefined') {
      localStorage.setItem('user_address', displayAddress);
      localStorage.setItem('user_full_precise_address', location.address);
      localStorage.setItem('user_city', servingTown);
      localStorage.setItem('user_pincode', location.pincode || '');
      localStorage.setItem('user_location_set', 'true');
      localStorage.setItem('user_plus_code', location.plusCode || '');
      window.dispatchEvent(new CustomEvent('user-address-updated'));
    }

    setSuccess(true);
    setTimeout(() => {
      setOpen(false);
      setSuccess(false);
      setLoading(false);
    }, 800);

    if (user && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
        address: displayAddress,
        fullAddress: location.address,
        city: servingTown,
        pincode: location.pincode || '',
        plusCode: location.plusCode || '',
        updatedAt: serverTimestamp(),
      }, { merge: true }).catch(() => {});
    }
  };

  const handleGetLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setView('manual');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const plusCode = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await response.json();
          
          if (!data || !data.address) throw new Error("No data");

          const addr = data.address;
          const fullPreciseAddress = data.display_name;
          
          saveLocationToDB({ 
            address: fullPreciseAddress, 
            pincode: addr.postcode || '',
            plusCode: plusCode
          });
        } catch (error) {
          setLoading(false);
          setView('manual');
        }
      },
      (error) => {
        setLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast({ 
            variant: "destructive", 
            title: "Location Permission Denied", 
            description: "Please enable GPS in settings or enter your address manually." 
          });
        }
        setView('manual');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const finalAddress = `${manualData.apartment ? manualData.apartment + ', ' : ''}${manualData.address}`;
    saveLocationToDB({ ...manualData, address: finalAddress });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* High Z-Index for Overlay to cover ZoneGuard */}
      <DialogOverlay className="z-[2000]" />
      <DialogContent className="rounded-t-[2.5rem] sm:rounded-[2.5rem] max-w-full sm:max-w-md border-none shadow-2xl overflow-hidden bg-white p-0 focus:outline-none flex flex-col sm:bottom-auto bottom-0 top-auto translate-y-0 sm:translate-y-[-50%] transition-all duration-500 z-[2001]">
        <div className="px-8 py-10">
          {view === 'prompt' ? (
            <div className="flex flex-col space-y-8">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-2">
                  <MapPin className="h-8 w-8" />
                </div>
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-black leading-none">
                  Delivery <span className="text-primary">Address</span>
                </DialogTitle>
                <DialogDescription className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  Pin your location for faster delivery
                </DialogDescription>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleGetLocation}
                  disabled={loading}
                  className={cn(
                    "flex items-center gap-4 p-6 rounded-[2rem] border-2 transition-all w-full active:scale-[0.98]",
                    success ? "border-green-500 bg-green-50" : "border-gray-50 bg-gray-50"
                  )}
                >
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-all",
                    success ? "bg-green-500 text-white" : "bg-white shadow-sm text-primary"
                  )}>
                    {loading && !success ? <Loader2 className="h-6 w-6 animate-spin" /> : <LocateFixed className="h-6 w-6" />}
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className={cn("text-sm font-black uppercase", success ? "text-green-700" : "text-black")}>
                      {success ? 'Spot Detected!' : 'Use Current Location'}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Detect via high-accuracy GPS</span>
                  </div>
                </button>

                <div className="relative flex items-center py-2 px-10">
                  <div className="flex-grow border-t border-gray-100"></div>
                  <span className="flex-shrink mx-4 text-[9px] font-black text-gray-300 uppercase">OR</span>
                  <div className="flex-grow border-t border-gray-100"></div>
                </div>

                <button
                  onClick={() => setView('searching')}
                  className="flex items-center gap-4 p-6 rounded-[2rem] border-2 border-gray-50 bg-gray-50 w-full active:scale-[0.98]"
                >
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400">
                    <Search className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-black uppercase text-black">Enter Address Manually</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Search your area or street</span>
                  </div>
                </button>
              </div>
              
              <div className="bg-primary/5 p-4 rounded-2xl flex items-center justify-center gap-3">
                 <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                 <p className="text-[9px] text-primary font-black uppercase tracking-widest text-center">
                    Premium Delivery Experience
                 </p>
              </div>
            </div>
          ) : view === 'searching' ? (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <button onClick={() => setView('prompt')} className="flex items-center text-primary text-[10px] font-black uppercase tracking-widest mb-6">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </button>

              <div className="space-y-6">
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      placeholder="Search Landmark, Area or Road..." 
                      className="h-14 rounded-2xl bg-gray-50 border-none pl-12 font-bold" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                 </div>

                 <div className="space-y-2 max-h-[350px] overflow-y-auto no-scrollbar">
                    {searchResults.length > 0 ? (
                      searchResults.map((item, i) => (
                        <button 
                          key={i} 
                          onClick={() => selectSearchResult(item)}
                          className="w-full text-left p-4 rounded-2xl hover:bg-gray-50 flex items-start gap-3 border border-transparent hover:border-gray-100 transition-all"
                        >
                           <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                           <div>
                              <p className="text-xs font-black text-gray-800 leading-tight mb-1">{item.display_name.split(',')[0]}</p>
                              <p className="text-[10px] text-gray-400 font-medium line-clamp-2">{item.display_name}</p>
                           </div>
                        </button>
                      ))
                    ) : searchQuery.length > 3 ? (
                      <div className="flex flex-col items-center justify-center py-10 opacity-20">
                         <Loader2 className="h-6 w-6 animate-spin mb-2" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Searching...</span>
                      </div>
                    ) : (
                      <div className="text-center py-10 opacity-20">
                         <MapIcon className="h-12 w-12 mx-auto mb-2" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Type to find your spot</span>
                      </div>
                    )}
                 </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <button onClick={() => setView('searching')} className="flex items-center text-primary text-[10px] font-black uppercase tracking-widest mb-6">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Change Selection
              </button>

              <div className="mb-6">
                <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">
                  Complete <span className="text-primary">Address.</span>
                </DialogTitle>
              </div>

              <form onSubmit={handleManualSave} className="space-y-5">
                <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <MapPin className="h-2.5 w-2.5" /> Selected Area
                   </label>
                   <p className="text-xs font-bold text-gray-800 line-clamp-2">{manualData.address}</p>
                </div>

                <Input 
                  placeholder="House No. / Floor / Building *" 
                  className="rounded-2xl h-14 bg-gray-50 border-none font-bold" 
                  value={manualData.apartment} 
                  onChange={(e) => setManualData({...manualData, apartment: e.target.value})} 
                  required 
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    placeholder="Pincode *" 
                    className="rounded-2xl h-14 bg-gray-50 border-none font-black italic text-lg" 
                    value={manualData.pincode} 
                    maxLength={6}
                    onChange={(e) => setManualData({...manualData, pincode: e.target.value.replace(/\D/g, '')})} 
                    required 
                  />
                  <div className="bg-blue-50/50 p-4 rounded-2xl flex flex-col justify-center border border-blue-100/50">
                     <span className="text-[8px] font-black text-blue-400 uppercase mb-0.5">Precise Spot</span>
                     <span className="text-[10px] font-black text-blue-600 truncate">{manualData.plusCode || 'Verified'}</span>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-16 bg-[#0B0B0B] text-white rounded-[2rem] font-black uppercase italic shadow-xl mt-4 active:scale-95 transition-all">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Confirm & Save'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
