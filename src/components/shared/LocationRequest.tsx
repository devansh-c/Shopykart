'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2, CheckCircle2, ChevronLeft, Building2, X, Home, PlusCircle, LocateFixed, AlertCircle, Search } from 'lucide-react';
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

  // Auto-fetch Town/State from Pincode
  useEffect(() => {
    if (manualData.pincode.length === 6) {
      const fetchPincodeDetails = async () => {
        setFetchingDetails(true);
        try {
          const response = await fetch(`https://api.postalpincode.in/pincode/${manualData.pincode}`);
          const data = await response.json();
          
          if (data[0].Status === "Success") {
            const details = data[0].PostOffice[0];
            // Prioritize Block (Town) as it is usually the more recognizable area name
            // Fallback to Name if Block is not available
            const townName = details.Block && details.Block !== "NA" ? details.Block : details.Name;
            
            setManualData(prev => ({
              ...prev,
              city: townName || details.District,
              state: details.State
            }));
            
            toast({
              title: "Location Detected",
              description: `${townName || details.District}, ${details.State}`
            });
          } else {
            toast({
              variant: "destructive",
              title: "Invalid Pincode",
              description: "Please check the code or enter manually."
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
    // 1. Instant Local Update
    localStorage.setItem('user_address', location.address);
    localStorage.setItem('user_location_set', 'true');
    setSuccess(true);
    
    // Dispatch custom event for real-time header update
    window.dispatchEvent(new CustomEvent('user-address-updated', { detail: location.address }));
    
    // Close dialog quickly
    setTimeout(() => {
      setOpen(false);
      setSuccess(false);
      setLoading(false);
    }, 800);

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
      timeout: 3000,
      maximumAge: Infinity 
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { signal: controller.signal }
          );
          
          clearTimeout(timeoutId);
          const data = await response.json();
          const address = data.address.suburb || data.address.neighbourhood || data.address.city_district || data.address.city || data.display_name.split(',')[0];
          const fullAddress = `${address}, ${data.address.city || data.address.state || ''}`;
          
          saveLocationToDB({ latitude, longitude, address: fullAddress, type: 'detected' });
        } catch (error) {
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
        setView('manual');
        toast({ variant: 'destructive', title: 'Location Error', description: 'Please enter address manually.' });
      },
      geoOptions
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
                  "flex items-center gap-3 font-bold text-sm py-2 transition-all w-full disabled:opacity-80",
                  success ? "text-green-600" : "text-green-600 hover:bg-green-50 rounded-xl"
                )}
              >
                <div className="bg-green-100 p-2.5 rounded-full mx-2 flex items-center justify-center">
                  {loading && !success ? (
                    <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                  ) : (
                    <LocateFixed className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-black uppercase tracking-tight">
                    {success ? 'Location Detected!' : 'Use my current location'}
                  </span>
                </div>
              </button>

              <div className="h-px bg-gray-100 w-full" />

              <button
                onClick={() => setView('manual')}
                className="flex items-center gap-3 text-gray-700 font-bold text-sm py-2 hover:bg-gray-50 rounded-xl transition-all w-full"
              >
                <div className="bg-gray-100 p-2 rounded-full mx-2">
                  <PlusCircle className="h-4 w-4 text-gray-600" />
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
                <div className="relative">
                  <Input 
                    placeholder="Enter Pincode" 
                    className="rounded-xl h-12 bg-gray-50 border-none pl-4 pr-10" 
                    value={manualData.pincode} 
                    maxLength={6}
                    onChange={(e) => setManualData({...manualData, pincode: e.target.value.replace(/\D/g, '')})} 
                    required 
                  />
                  {fetchingDetails && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1">Town/City</label>
                    <Input placeholder="Town" className="rounded-xl h-12 bg-gray-50 border-none" value={manualData.city} onChange={(e) => setManualData({...manualData, city: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1">State</label>
                    <Input placeholder="State" className="rounded-xl h-12 bg-gray-50 border-none" value={manualData.state} onChange={(e) => setManualData({...manualData, state: e.target.value})} required />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1">House / Street / Area</label>
                  <Input placeholder="Street name and area" className="rounded-xl h-12 bg-gray-50 border-none" value={manualData.address} onChange={(e) => setManualData({...manualData, address: e.target.value})} required />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1">Apartment (Optional)</label>
                  <Input placeholder="Flat / Floor / Landmark" className="rounded-xl h-12 bg-gray-50 border-none" value={manualData.apartment} onChange={(e) => setManualData({...manualData, apartment: e.target.value})} />
                </div>
                
                <Button type="submit" disabled={loading || fetchingDetails} className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase italic tracking-tighter shadow-xl shadow-green-600/20 mt-4 transition-all">
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
