
'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2, CheckCircle2, ChevronLeft, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
      const timer = setTimeout(() => setOpen(true), 2000);
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

    // Follow mutation best practices (no await)
    setDoc(userRef, finalData, { merge: true })
      .then(() => {
        localStorage.setItem('user_address', location.address);
        localStorage.setItem('user_location_set', 'true');
        setSuccess(true);
        
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          window.location.reload();
        }, 1000);
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: finalData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
          variant: 'destructive',
          title: 'Error Saving',
          description: 'Please try again later.',
        });
        setLoading(false);
      });
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      toast({ variant: 'destructive', title: 'Not Supported', description: 'Geolocation is not supported.' });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          const address = data.display_name || 'Detected Location';
          
          saveLocationToDB({
            latitude,
            longitude,
            address,
            type: 'detected'
          });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch address.' });
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        toast({ variant: 'destructive', title: 'Denied', description: 'Location access denied.' });
      }
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
      <DialogContent className="rounded-[2.5rem] max-w-sm border-none shadow-2xl overflow-hidden z-[150] bg-white p-0">
        <div className="bg-primary h-1.5 w-full" />
        
        <div className="p-8">
          {view === 'prompt' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mx-auto bg-primary/10 h-24 w-24 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                {success ? (
                  <CheckCircle2 className="h-12 w-12 text-green-500 animate-in zoom-in" />
                ) : (
                  <MapPin className="h-12 w-12 text-primary animate-bounce" />
                )}
              </div>

              <DialogHeader className="space-y-2">
                <DialogTitle className="text-3xl font-black italic uppercase text-center tracking-tighter leading-tight">
                  Where to <br /><span className="text-primary">Deliver?</span>
                </DialogTitle>
                <DialogDescription className="text-center font-medium text-muted-foreground px-2 text-sm">
                  We need your location to show the best restaurants in your area.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-8 space-y-3">
                <Button
                  onClick={handleGetLocation}
                  disabled={loading || success}
                  className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase italic tracking-tighter shadow-xl shadow-primary/20"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                      <Navigation className="h-4 w-4 mr-2" />
                      USE MY CURRENT LOCATION
                    </>
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => setView('manual')}
                  className="w-full h-12 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted/50 rounded-xl"
                >
                  Enter Address Manually
                </Button>
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

              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
                  Enter <span className="text-primary">Details</span>
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleManualSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pincode *</label>
                    <Input 
                      placeholder="110001" 
                      className="rounded-xl h-11 border-muted"
                      value={manualData.pincode}
                      onChange={(e) => setManualData({...manualData, pincode: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">State *</label>
                    <Input 
                      placeholder="Delhi" 
                      className="rounded-xl h-11 border-muted"
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
                    className="rounded-xl h-11 border-muted"
                    value={manualData.address}
                    onChange={(e) => setManualData({...manualData, address: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Apartment / Suite (Optional)</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input 
                      placeholder="E.g. Floor 4, Flat 402" 
                      className="rounded-xl h-11 border-muted pl-10"
                      value={manualData.apartment}
                      onChange={(e) => setManualData({...manualData, apartment: e.target.value})}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || success}
                  className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase italic tracking-tighter shadow-xl shadow-primary/20 mt-4"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'SAVE ADDRESS'}
                </Button>
              </form>
            </div>
          )}
        </div>

        <div className="bg-muted/30 p-4 text-center">
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
            Privacy Guaranteed • Encrypted Connection
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
