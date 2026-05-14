
'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2, CheckCircle2, ChevronLeft, Building2, X, Home, PlusCircle, LocateFixed, AlertCircle } from 'lucide-react';
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

export function LocationRequest() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ViewState>('prompt');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Manual Form State
  const [manualData, setManualData] = useState({
    pincode: '',
    state: '',
    address: '',
    apartment: '',
  });

  useEffect(() => {
    const hasLocation = localStorage.getItem('user_location_set');
    if (!hasLocation && user) {
      const timer = setTimeout(() => setOpen(true), 1000);
      return () => clearTimeout(timer);
    }

    const handleOpen = () => {
      setView('prompt');
      setOpen(true);
    };
    window.addEventListener('open-location-picker', handleOpen);
    return () => window.removeEventListener('open-location-picker', handleOpen);
  }, [user]);

  const saveLocationToDB = async (location: any) => {
    // 1. Instant Local Update (Optimistic)
    localStorage.setItem('user_address', location.address);
    localStorage.setItem('user_location_set', 'true');
    setSuccess(true);
    
    // Trigger global UI update immediately
    window.dispatchEvent(new Event('storage'));
    
    // Close dialog almost instantly for 2-second feel
    setTimeout(() => {
      setOpen(false);
      setSuccess(false);
      setLoading(false);
    }, 600);

    // 2. Background Database Sync
    if (user && firestore) {
      const userRef = doc(firestore, 'users', user.uid, 'profile', 'data');
      const finalData = {
        location,
        updatedAt: serverTimestamp(),
      };

      setDoc(userRef, finalData, { merge: true })
        .catch(async (err) => {
          const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
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
    
    // Top-tier apps use low accuracy for instant results via Wi-Fi/Cell
    const geoOptions = {
      enableHighAccuracy: false, 
      timeout: 3000, // Hard 3s limit
      maximumAge: 1000 * 60 * 5 // Use location cached within last 5 mins
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Fast reverse geocode with 1.5s timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500);
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { signal: controller.signal }
          );
          
          clearTimeout(timeoutId);
          const data = await response.json();
          // Extract short, meaningful address parts
          const address = data.address.suburb || data.address.neighbourhood || data.address.city || data.display_name.split(',')[0];
          const fullAddress = `${address}, ${data.address.city || ''}`;
          
          saveLocationToDB({ latitude, longitude, address: fullAddress, type: 'detected' });
        } catch (error) {
          // Fallback if geocoding fails or is slow
          saveLocationToDB({ 
            latitude, 
            longitude, 
            address: `Current Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`, 
            type: 'detected' 
          });
        }
      },
      (error) => {
        setLoading(false);
        // If user blocked or GPS failed, switch to manual instantly
        setView('manual');
        toast({ variant: 'destructive', title: 'Location Error', description: 'Permission denied or signal weak.' });
      },
      geoOptions
    );
  };

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const fullAddressString = `${manualData.apartment ? manualData.apartment + ', ' : ''}${manualData.address}, ${manualData.state} - ${manualData.pincode}`;
    saveLocationToDB({ ...manualData, address: fullAddressString, type: 'manual' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-t-[2.5rem] sm:rounded-[2.5rem] max-w-full sm:max-w-md border-none shadow-2xl overflow-hidden z-[150] bg-white p-0 focus:outline-none flex flex-col sm:bottom-auto bottom-0 top-auto translate-y-0 sm:translate-y-[-50%] transition-transform duration-300">
        <div className="flex items-center justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-6 py-8">
          {view === 'prompt' ? (
            <div className="flex flex-col space-y-6">
              <div className="space-y-1">
                <DialogTitle className="text-lg font-bold text-black leading-tight">
                  Hey Welcome Back!
                </DialogTitle>
                <DialogDescription className="text-base font-bold text-black leading-tight">
                  Which location do you want to select?
                </DialogDescription>
              </div>

              <button
                onClick={handleGetLocation}
                disabled={loading}
                className={cn(
                  "flex items-center gap-3 font-bold text-sm py-4 rounded-2xl transition-all w-full disabled:opacity-80 border",
                  success ? "bg-green-50 border-green-200 text-green-600" : "bg-white border-green-100 text-green-600 hover:bg-green-50"
                )}
              >
                {loading && !success ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-4 text-green-600" />
                ) : success ? (
                  <div className="bg-green-600 p-2.5 rounded-full mx-2 animate-in zoom-in">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                ) : (
                  <div className="bg-green-100 p-2.5 rounded-full mx-2">
                    <LocateFixed className="h-5 w-5" />
                  </div>
                )}
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-black uppercase tracking-tight">
                    {success ? 'Location Detected!' : 'Use my current location'}
                  </span>
                  <span className="text-[10px] opacity-60 font-medium italic">
                    {success ? 'Redirecting you now...' : 'Instant detection (2 seconds)'}
                  </span>
                </div>
              </button>

              <div className="h-px bg-gray-100 w-full" />

              <button
                onClick={() => setView('manual')}
                className="flex items-center gap-3 text-gray-700 font-bold text-sm py-3 hover:bg-gray-50 rounded-xl transition-all w-full"
              >
                <div className="bg-gray-100 p-2 rounded-full mx-2">
                  <PlusCircle className="h-4 w-4" />
                </div>
                <span className="text-sm font-black uppercase tracking-tight">Add New Address</span>
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button onClick={() => setView('prompt')} className="flex items-center text-green-600 text-[10px] font-black uppercase tracking-widest mb-6 group">
                <ChevronLeft className="h-3 w-3 mr-1" />
                Back
              </button>

              <div className="mb-6">
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
                  Enter <span className="text-primary">Details</span>
                </DialogTitle>
                <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                  Enter your address manually
                </DialogDescription>
              </div>

              <form onSubmit={handleManualSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Pincode" className="rounded-xl h-12 bg-gray-50 border-none" value={manualData.pincode} onChange={(e) => setManualData({...manualData, pincode: e.target.value})} required />
                  <Input placeholder="State" className="rounded-xl h-12 bg-gray-50 border-none" value={manualData.state} onChange={(e) => setManualData({...manualData, state: e.target.value})} required />
                </div>
                <Input placeholder="House / Street / Area" className="rounded-xl h-12 bg-gray-50 border-none" value={manualData.address} onChange={(e) => setManualData({...manualData, address: e.target.value})} required />
                <Input placeholder="Apartment (Optional)" className="rounded-xl h-12 bg-gray-50 border-none" value={manualData.apartment} onChange={(e) => setManualData({...manualData, apartment: e.target.value})} />
                
                <Button type="submit" disabled={loading} className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase italic tracking-tighter shadow-xl shadow-green-600/20 mt-4 transition-all">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'SAVE ADDRESS'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
