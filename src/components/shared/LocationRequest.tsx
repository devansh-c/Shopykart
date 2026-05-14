
'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2, CheckCircle2, ChevronLeft, Building2, X } from 'lucide-react';
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

  const saveLocationToDB = (location: any) => {
    if (!user || !firestore) return;

    const userRef = doc(firestore, 'users', user.uid, 'profile', 'data');
    const finalData = {
      location,
      updatedAt: serverTimestamp(),
    };

    setDoc(userRef, finalData, { merge: true })
      .then(() => {
        localStorage.setItem('user_address', location.address);
        localStorage.setItem('user_location_set', 'true');
        setSuccess(true);
        
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          // Refresh components that depend on location
          window.dispatchEvent(new Event('storage'));
        }, 800);
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: finalData,
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      });
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      toast({ variant: 'destructive', title: 'Not Supported', description: 'Geolocation is not supported.' });
      return;
    }

    setLoading(true);
    
    // Set a safety timeout for geolocation
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        toast({ 
          variant: 'destructive', 
          title: 'Request Timeout', 
          description: 'Taking too long. Please enter address manually.' 
        });
        setView('manual');
      }
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId);
        const { latitude, longitude } = position.coords;
        try {
          // Faster reverse geocoding approach or simple coords
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          const address = data.display_name?.split(',').slice(0, 3).join(',') || 'Detected Location';
          
          saveLocationToDB({
            latitude,
            longitude,
            address,
            type: 'detected'
          });
        } catch (error) {
          saveLocationToDB({
            latitude,
            longitude,
            address: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
            type: 'detected'
          });
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        setLoading(false);
        let msg = 'Location access denied.';
        if (error.code === error.TIMEOUT) msg = 'Location request timed out.';
        toast({ variant: 'destructive', title: 'Error', description: msg });
        setView('manual');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualData.pincode || !manualData.state || !manualData.address) {
      toast({ variant: 'destructive', title: 'Missing Info', description: 'Please fill required fields.' });
      return;
    }

    setLoading(true);
    const fullAddressString = `${manualData.apartment ? manualData.apartment + ', ' : ''}${manualData.address}, ${manualData.state} - ${manualData.pincode}`;
    
    saveLocationToDB({
      ...manualData,
      address: fullAddressString,
      type: 'manual'
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-[2.5rem] max-w-[90%] sm:max-w-sm border-none shadow-2xl overflow-hidden z-[150] bg-white p-0 focus:outline-none">
        {/* Brand Bar */}
        <div className="bg-primary h-1.5 w-full" />
        
        {/* Close Button UI matches screenshot */}
        <div className="absolute right-6 top-6">
          <DialogClose className="opacity-40 hover:opacity-100 transition-opacity">
            <X className="h-5 w-5" />
          </DialogClose>
        </div>

        <div className="px-8 pt-10 pb-12">
          {view === 'prompt' ? (
            <div className="flex flex-col items-center">
              {/* Central Pin Icon Card */}
              <div className="bg-[#FFF1F1] h-28 w-28 rounded-[2rem] flex items-center justify-center mb-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="bg-white p-4 rounded-2xl shadow-sm">
                   <MapPin className="h-10 w-10 text-primary" />
                </div>
              </div>

              <div className="space-y-4 text-center mb-12">
                <h2 className="text-[2.5rem] font-black italic uppercase leading-[1] tracking-tighter">
                  WHERE TO <br />
                  <span className="text-primary italic">DELIVER?</span>
                </h2>
                <p className="text-gray-400 font-medium px-4 text-sm leading-relaxed">
                  We need your location to show the best restaurants in your area.
                </p>
              </div>

              <div className="w-full space-y-6">
                <Button
                  onClick={handleGetLocation}
                  disabled={loading || success}
                  className="w-full h-16 bg-primary text-white rounded-2xl font-black uppercase italic tracking-tighter shadow-xl shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all text-sm px-6"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      FINDING LOCATION...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <Navigation className="h-4 w-4" />
                      USE MY CURRENT LOCATION
                    </div>
                  )}
                </Button>
                
                <button
                  onClick={() => setView('manual')}
                  className="w-full text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-foreground transition-colors py-2"
                >
                  ENTER ADDRESS MANUALLY
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <button 
                onClick={() => setView('prompt')}
                className="flex items-center text-primary text-[10px] font-black uppercase tracking-widest mb-6 group"
              >
                <ChevronLeft className="h-3 w-3 mr-1 group-hover:-translate-x-1 transition-transform" />
                Back
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">
                  Enter <span className="text-primary">Details</span>
                </h2>
              </div>

              <form onSubmit={handleManualSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pincode *</label>
                    <Input 
                      placeholder="110001" 
                      className="rounded-xl h-11 border-muted bg-muted/20"
                      value={manualData.pincode}
                      onChange={(e) => setManualData({...manualData, pincode: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">State *</label>
                    <Input 
                      placeholder="Delhi" 
                      className="rounded-xl h-11 border-muted bg-muted/20"
                      value={manualData.state}
                      onChange={(e) => setManualData({...manualData, state: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">House / Street / Area *</label>
                  <Input 
                    placeholder="E.g. 123, Skyline Apartments" 
                    className="rounded-xl h-11 border-muted bg-muted/20"
                    value={manualData.address}
                    onChange={(e) => setManualData({...manualData, address: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Apartment (Optional)</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input 
                      placeholder="E.g. Floor 4, Flat 402" 
                      className="rounded-xl h-11 border-muted pl-10 bg-muted/20"
                      value={manualData.apartment}
                      onChange={(e) => setManualData({...manualData, apartment: e.target.value})}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || success}
                  className="w-full h-16 bg-primary text-white rounded-2xl font-black uppercase italic tracking-tighter shadow-xl shadow-primary/20 mt-4 active:scale-95 transition-all"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'SAVE ADDRESS'}
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Legal Trust Footer */}
        <div className="bg-gray-50/50 py-5 text-center border-t border-gray-100">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">
            PRIVACY GUARANTEED • ENCRYPTED CONNECTION
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
