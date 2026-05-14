
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
    if (!user || !firestore) {
      setLoading(false);
      return;
    }

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
        window.dispatchEvent(new Event('storage'));

        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          setLoading(false);
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

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: 'destructive', title: 'Not Supported', description: 'Geolocation is not supported.' });
      return;
    }

    setLoading(true);
    
    // Prioritize actual current location even if slow
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 20000, // Wait up to 20 seconds for slow GPS
      maximumAge: 0 // Don't use cached location, get fresh one
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode with a slightly longer timeout for slow networks
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { signal: controller.signal }
          );
          
          clearTimeout(timeoutId);
          const data = await response.json();
          // Extract meaningful part of address
          const address = data.display_name?.split(',').slice(0, 3).join(',') || `📍 Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          
          saveLocationToDB({ latitude, longitude, address, type: 'detected' });
        } catch (error) {
          // Even if geocoding fails, save the coordinates
          saveLocationToDB({ 
            latitude, 
            longitude, 
            address: `📍 Detected Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`, 
            type: 'detected' 
          });
        }
      },
      (error) => {
        setLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast({ variant: 'destructive', title: 'Permission Denied', description: 'Please enable location access in settings.' });
          setView('manual');
        } else {
          toast({ variant: 'destructive', title: 'Location Error', description: 'Unable to get location. Please try adding manually.' });
          setView('manual');
        }
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
                className="flex items-center gap-3 text-green-600 font-bold text-sm py-4 hover:bg-green-50 rounded-2xl transition-all w-full disabled:opacity-50 border border-green-100"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-2" />
                ) : (
                  <div className="bg-green-100 p-2.5 rounded-full mx-2">
                    <LocateFixed className="h-5 w-5" />
                  </div>
                )}
                <div className="flex flex-col items-start">
                  <span className="text-sm font-black uppercase tracking-tight">Use my current location</span>
                  <span className="text-[10px] opacity-60 font-medium italic">Fetching actual GPS location...</span>
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
