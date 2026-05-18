
'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2, CheckCircle2, ChevronLeft, Building2, X, Home, PlusCircle, LocateFixed, AlertCircle, Search, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';

type ViewState = 'prompt' | 'manual';

const ALLOWED_PINCODES = ['284205', '284204'];
const SERVICEABLE_AREAS = ['Ranipur', 'Mauranipur'];

export function LocationRequest() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ViewState>('prompt');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  // Manual Form State
  const [manualData, setManualData] = useState({
    pincode: '',
    state: '',
    city: '',
    address: '',
    apartment: '',
  });

  useEffect(() => {
    const hasLocation = localStorage.getItem('user_location_set');
    if (!hasLocation && user) {
      // Show pop-up immediately after splash/auth
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

  // Auto-fetch Town/State from Pincode with strict service area check
  useEffect(() => {
    if (manualData.pincode.length === 6) {
      if (!ALLOWED_PINCODES.includes(manualData.pincode)) {
        toast({
          variant: "destructive",
          title: "Service Not Available",
          description: "We currently only serve Ranipur and Mauranipur."
        });
        return;
      }

      const fetchPincodeDetails = async () => {
        setFetchingDetails(true);
        try {
          const response = await fetch(`https://api.postalpincode.in/pincode/${manualData.pincode}`);
          const data = await response.json();
          
          if (data[0].Status === "Success") {
            const postOffices = data[0].PostOffice;
            const mainTown = postOffices.find((po: any) => po.BranchType === "Sub Post Office") || postOffices[0];
            const townName = mainTown.Name;
            
            setManualData(prev => ({
              ...prev,
              city: townName,
              state: mainTown.State
            }));
            
            toast({
              title: "Serviceable Area Detected",
              description: `Welcome! We deliver in ${townName}.`
            });
          }
        } catch (error) {
          console.error("Error fetching pincode details", error);
        } finally {
          setFetchingDetails(false);
        }
      };
      fetchPincodeDetails();
    }
  }, [manualData.pincode, toast]);

  const saveLocationToDB = async (location: any) => {
    let townName = '';
    if (location.pincode === '284205' || location.address?.includes('Ranipur')) {
      townName = 'Ranipur';
    } else if (location.pincode === '284204' || location.address?.includes('Mauranipur')) {
      townName = 'Mauranipur';
    }

    if (!townName) {
      toast({
        variant: "destructive",
        title: "Outside Service Area",
        description: "Please select an address within Ranipur or Mauranipur."
      });
      setLoading(false);
      return;
    }

    localStorage.setItem('user_address', location.address);
    localStorage.setItem('user_town', townName);
    localStorage.setItem('user_location_set', 'true');
    setSuccess(true);
    
    window.dispatchEvent(new CustomEvent('user-address-updated', { detail: { address: location.address, town: townName } }));
    
    setTimeout(() => {
      setOpen(false);
      setSuccess(false);
      setLoading(false);
    }, 800);

    if (user && firestore) {
      const userRef = doc(firestore, 'users', user.uid, 'profile', 'data');
      const finalData = {
        location: { ...location, town: townName },
        updatedAt: serverTimestamp(),
      };

      setDoc(userRef, finalData, { merge: true })
        .catch(async (err) => {
          const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'write',
            requestResourceData: finalData,
          });
          errorEmitter.emit('permission-error', permissionError);
        });
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: 'destructive', title: 'Not Supported', description: 'Geolocation is not supported.' });
      return;
    }

    setLoading(true);
    
    const geoOptions = {
      enableHighAccuracy: false, 
      timeout: 5000, 
      maximumAge: Infinity 
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { signal: controller.signal }
          );
          
          clearTimeout(timeoutId);
          const data = await response.json();
          const addressPart = data.address.suburb || data.address.neighbourhood || data.address.city_district || data.address.city || data.display_name.split(',')[0];
          
          const isRanipur = data.display_name.toLowerCase().includes('ranipur');
          const isMauranipur = data.display_name.toLowerCase().includes('mauranipur');

          if (!isRanipur && !isMauranipur) {
            setLoading(false);
            setView('manual');
            toast({ 
              variant: 'destructive', 
              title: 'Outside Service Area', 
              description: 'We currently only deliver in Ranipur and Mauranipur.' 
            });
            return;
          }

          const fullAddress = `${addressPart}, ${data.address.city || data.address.state || ''}`;
          saveLocationToDB({ latitude, longitude, address: fullAddress, type: 'detected' });
        } catch (error) {
          setLoading(false);
          setView('manual');
          toast({ variant: 'destructive', title: 'Manual Entry Required', description: 'Enter address manually for better accuracy.' });
        }
      },
      (error) => {
        setLoading(false);
        setView('manual');
        toast({ variant: 'destructive', title: 'Location Error', description: 'Please enter address manually.' });
      },
      geoOptions
    );
  };

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ALLOWED_PINCODES.includes(manualData.pincode)) {
      toast({ variant: "destructive", title: "Sorry!", description: "We only deliver in Ranipur & Mauranipur." });
      return;
    }
    setLoading(true);
    const fullAddressString = `${manualData.apartment ? manualData.apartment + ', ' : ''}${manualData.address}, ${manualData.city}, ${manualData.state} - ${manualData.pincode}`;
    saveLocationToDB({ ...manualData, address: fullAddressString, type: 'manual' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-t-[3rem] sm:rounded-[3rem] max-w-full sm:max-w-md border-none shadow-2xl overflow-hidden z-[150] bg-white p-0 focus:outline-none flex flex-col sm:bottom-auto bottom-0 top-auto translate-y-0 sm:translate-y-[-50%] transition-all duration-500 ease-premium">
        {/* Visual Handle for Mobile */}
        <div className="flex items-center justify-center pt-4 sm:hidden">
          <div className="w-12 h-1.5 bg-gray-100 rounded-full" />
        </div>

        <div className="px-8 py-10">
          {view === 'prompt' ? (
            <div className="flex flex-col space-y-8 animate-in fade-in zoom-in duration-300">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-2">
                  <Sparkles className="h-8 w-8" />
                </div>
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-black leading-none">
                  Choose Your <span className="text-primary">Spot</span>
                </DialogTitle>
                <DialogDescription className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  To show you the best gourmet selection
                </DialogDescription>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleGetLocation}
                  disabled={loading}
                  className={cn(
                    "group relative overflow-hidden flex items-center gap-4 p-6 rounded-[2rem] border-2 transition-all duration-300 w-full active:scale-[0.98]",
                    success ? "border-green-500 bg-green-50" : "border-gray-50 bg-gray-50 hover:border-primary/20 hover:bg-white"
                  )}
                >
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-all",
                    success ? "bg-green-500 text-white" : "bg-white shadow-sm text-primary group-hover:scale-110"
                  )}>
                    {loading && !success ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <LocateFixed className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className={cn(
                      "text-sm font-black uppercase tracking-tight",
                      success ? "text-green-700" : "text-black"
                    )}>
                      {success ? 'Spot Fixed!' : 'Detect My Spot'}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Fast GPS Auto-Detection</span>
                  </div>
                  {!loading && !success && <Navigation className="absolute right-6 h-4 w-4 text-gray-200 group-hover:text-primary/30 transition-colors" />}
                </button>

                <div className="relative flex items-center py-2 px-10">
                  <div className="flex-grow border-t border-gray-100"></div>
                  <span className="flex-shrink mx-4 text-[9px] font-black text-gray-300 uppercase tracking-widest">OR</span>
                  <div className="flex-grow border-t border-gray-100"></div>
                </div>

                <button
                  onClick={() => setView('manual')}
                  className="flex items-center gap-4 p-6 rounded-[2rem] border-2 border-gray-50 bg-gray-50 hover:bg-white hover:border-primary/20 transition-all duration-300 w-full active:scale-[0.98] group"
                >
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-primary transition-all group-hover:scale-110">
                    <PlusCircle className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-black uppercase tracking-tight text-black">Type Address</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Manual entry for Ranipur</span>
                  </div>
                </button>
              </div>
              
              <div className="bg-primary/5 p-4 rounded-2xl flex items-center justify-center gap-3">
                 <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                 <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] text-center">
                    Service Live in Ranipur & Mauranipur
                 </p>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <button onClick={() => setView('prompt')} className="flex items-center text-primary text-[10px] font-black uppercase tracking-widest mb-8 hover:opacity-70 transition-opacity">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Selection
              </button>

              <div className="mb-8">
                <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">
                  Store <span className="text-primary">Details.</span>
                </DialogTitle>
                <DialogDescription className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2 opacity-60">
                  Manual Entry for Serviceable Zones
                </DialogDescription>
              </div>

              <form onSubmit={handleManualSave} className="space-y-5">
                <div className="relative">
                  <Input 
                    placeholder="Enter Pincode (284205/284204)" 
                    className="rounded-2xl h-14 bg-gray-50 border-none pl-5 pr-12 text-lg font-black italic focus-visible:ring-1 focus-visible:ring-primary/20" 
                    value={manualData.pincode} 
                    maxLength={6}
                    onChange={(e) => setManualData({...manualData, pincode: e.target.value.replace(/\D/g, '')})} 
                    required 
                  />
                  {fetchingDetails && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2">Town</label>
                    <Input placeholder="Town" className="rounded-2xl h-12 bg-gray-50/50 border-none font-bold" value={manualData.city} readOnly />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2">State</label>
                    <Input placeholder="State" className="rounded-2xl h-12 bg-gray-50/50 border-none font-bold" value={manualData.state} readOnly />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2">Address Line</label>
                  <Input placeholder="E.g. Near Gandhi Ganj, Main Market" className="rounded-2xl h-14 bg-gray-50 border-none font-bold placeholder:font-normal focus-visible:ring-1 focus-visible:ring-primary/20" value={manualData.address} onChange={(e) => setManualData({...manualData, address: e.target.value})} required />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2">House No / Landmark</label>
                  <Input placeholder="Flat / House / Nearby Landmark" className="rounded-2xl h-14 bg-gray-50 border-none font-bold placeholder:font-normal focus-visible:ring-1 focus-visible:ring-primary/20" value={manualData.apartment} onChange={(e) => setManualData({...manualData, apartment: e.target.value})} />
                </div>
                
                <Button type="submit" disabled={loading || fetchingDetails || manualData.pincode.length < 6} className="w-full h-16 bg-[#0B0B0B] hover:bg-primary text-white rounded-3xl font-black uppercase italic tracking-tighter shadow-xl shadow-black/10 mt-6 transition-all duration-300">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'CONFIRM ADDRESS'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

