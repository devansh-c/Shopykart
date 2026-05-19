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

export function LocationRequest() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ViewState>('prompt');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  const [manualData, setManualData] = useState({
    pincode: '',
    state: '',
    city: '',
    address: '',
    apartment: '',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
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
    if (manualData.pincode.length === 6) {
      if (!ALLOWED_PINCODES.includes(manualData.pincode)) {
        toast({
          variant: "destructive",
          title: "Service Not Available",
          description: "We currently only serve Ranipur (284205) and Mauranipur (284204)."
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
            setManualData(prev => ({
              ...prev,
              city: mainTown.Name,
              state: mainTown.State
            }));
          }
        } catch (error) {
          console.warn("Pincode API error:", error);
        } finally {
          setFetchingDetails(false);
        }
      };
      fetchPincodeDetails();
    }
  }, [manualData.pincode, toast]);

  const saveLocationToDB = async (location: any) => {
    let townName = '';
    const fullAddr = (location.address || '').toLowerCase();
    
    if (location.pincode === '284205' || fullAddr.includes('ranipur')) {
      townName = 'Ranipur';
    } else if (location.pincode === '284204' || fullAddr.includes('mauranipur')) {
      townName = 'Mauranipur';
    }

    if (!townName) {
      toast({
        variant: "destructive",
        title: "Outside Service Area",
        description: "Please select an address in Ranipur or Mauranipur."
      });
      setLoading(false);
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('user_address', location.address);
      localStorage.setItem('user_town', townName);
      localStorage.setItem('user_location_set', 'true');
      window.dispatchEvent(new CustomEvent('user-address-updated'));
    }

    setSuccess(true);
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

      setDoc(userRef, finalData, { merge: true }).catch(() => {});
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
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`);
          const data = await response.json();
          const display = data.display_name || 'Detected Location';
          saveLocationToDB({ latitude, longitude, address: display, type: 'gps' });
        } catch (error) {
          setLoading(false);
          setView('manual');
        }
      },
      () => {
        setLoading(false);
        setView('manual');
      },
      { timeout: 5000 }
    );
  };

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const fullAddressString = `${manualData.apartment ? manualData.apartment + ', ' : ''}${manualData.address}, ${manualData.city}, ${manualData.state} - ${manualData.pincode}`;
    saveLocationToDB({ ...manualData, address: fullAddressString, type: 'manual' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-t-[3rem] sm:rounded-[3rem] max-w-full sm:max-w-md border-none shadow-2xl overflow-hidden z-[150] bg-white p-0 focus:outline-none flex flex-col sm:bottom-auto bottom-0 top-auto translate-y-0 sm:translate-y-[-50%] transition-all duration-500">
        <div className="px-8 py-10">
          {view === 'prompt' ? (
            <div className="flex flex-col space-y-8">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-2">
                  <Sparkles className="h-8 w-8" />
                </div>
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-black leading-none">
                  Set Your <span className="text-primary">Spot</span>
                </DialogTitle>
                <DialogDescription className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  Quality delivery starting from your location
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
                      {success ? 'Spot Fixed!' : 'Detect My Spot'}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">GPS Auto-Detection</span>
                  </div>
                </button>

                <div className="relative flex items-center py-2 px-10">
                  <div className="flex-grow border-t border-gray-100"></div>
                  <span className="flex-shrink mx-4 text-[9px] font-black text-gray-300 uppercase">OR</span>
                  <div className="flex-grow border-t border-gray-100"></div>
                </div>

                <button
                  onClick={() => setView('manual')}
                  className="flex items-center gap-4 p-6 rounded-[2rem] border-2 border-gray-50 bg-gray-50 w-full active:scale-[0.98]"
                >
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400">
                    <PlusCircle className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-black uppercase text-black">Type Address</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">Manual entry</span>
                  </div>
                </button>
              </div>
              
              <div className="bg-primary/5 p-4 rounded-2xl flex items-center justify-center gap-3">
                 <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                 <p className="text-[9px] text-primary font-black uppercase tracking-widest text-center">
                    Serving Ranipur & Mauranipur
                 </p>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <button onClick={() => setView('prompt')} className="flex items-center text-primary text-[10px] font-black uppercase tracking-widest mb-8">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </button>

              <div className="mb-8">
                <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">
                  Store <span className="text-primary">Details.</span>
                </DialogTitle>
              </div>

              <form onSubmit={handleManualSave} className="space-y-5">
                <Input 
                  placeholder="Enter Pincode (284205/284204)" 
                  className="rounded-2xl h-14 bg-gray-50 border-none font-black italic text-lg" 
                  value={manualData.pincode} 
                  maxLength={6}
                  onChange={(e) => setManualData({...manualData, pincode: e.target.value.replace(/\D/g, '')})} 
                  required 
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Town" className="rounded-2xl h-12 bg-gray-50/50 border-none font-bold" value={manualData.city} readOnly />
                  <Input placeholder="State" className="rounded-2xl h-12 bg-gray-50/50 border-none font-bold" value={manualData.state} readOnly />
                </div>

                <Input placeholder="Full Address Line" className="rounded-2xl h-14 bg-gray-50 border-none font-bold" value={manualData.address} onChange={(e) => setManualData({...manualData, address: e.target.value})} required />
                <Input placeholder="House No / Landmark" className="rounded-2xl h-14 bg-gray-50 border-none font-bold" value={manualData.apartment} onChange={(e) => setManualData({...manualData, apartment: e.target.value})} />
                
                <Button type="submit" disabled={loading || fetchingDetails || manualData.pincode.length < 6} className="w-full h-16 bg-[#0B0B0B] text-white rounded-3xl font-black uppercase italic shadow-xl mt-6">
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
