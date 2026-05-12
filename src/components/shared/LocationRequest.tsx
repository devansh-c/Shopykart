
'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2, CheckCircle2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function LocationRequest() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if location is already in localStorage to avoid repeated prompts
    const hasLocation = localStorage.getItem('user_location_set');
    if (!hasLocation && user) {
      const timer = setTimeout(() => setOpen(true), 2000);
      return () => clearTimeout(timer);
    }

    // Listen for manual trigger to change location
    const handleOpen = () => setOpen(true);
    window.addEventListener('open-location-picker', handleOpen);
    return () => window.removeEventListener('open-location-picker', handleOpen);
  }, [user]);

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Not Supported',
        description: 'Geolocation is not supported by your browser.',
      });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Using Nominatim (OpenStreetMap) for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.display_name || 'Detected Location';

          if (user && firestore) {
            const userRef = doc(firestore, 'users', user.uid, 'profile', 'data');
            const locationData = {
              location: {
                latitude,
                longitude,
                address,
                updatedAt: new Date().toISOString(),
              },
              updatedAt: serverTimestamp(),
            };

            // Save to Firestore
            setDoc(userRef, locationData, { merge: true })
              .catch(async (err) => {
                const permissionError = new FirestorePermissionError({
                  path: userRef.path,
                  operation: 'update',
                  requestResourceData: locationData,
                });
                errorEmitter.emit('permission-error', permissionError);
              });

            // Save to LocalStorage for immediate UI feedback
            localStorage.setItem('user_address', address);
            localStorage.setItem('user_location_set', 'true');
            
            setSuccess(true);
            toast({
              title: "Location Updated",
              description: "We've detected your address accurately.",
            });

            setTimeout(() => {
              setOpen(false);
              setSuccess(false);
              window.location.reload(); 
            }, 1000);
          }
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not fetch your address. Please try manual entry.',
          });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        toast({
          variant: 'destructive',
          title: 'Permission Denied',
          description: 'Please enable location access in your browser settings.',
        });
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-[2.5rem] max-w-sm border-none shadow-2xl overflow-hidden z-[150] bg-white p-0">
        <div className="bg-primary h-1.5 w-full" />
        
        <div className="p-8">
          <div className="mx-auto bg-primary/10 h-24 w-24 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner rotate-3 transition-transform hover:rotate-0">
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
              We need your location to show you the best restaurants and active deals in your area.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8 space-y-3">
            <Button
              onClick={handleGetLocation}
              disabled={loading || success}
              className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase italic tracking-tighter shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : success ? (
                'LOCATION DETECTED!'
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  USE MY CURRENT LOCATION
                </>
              )}
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="w-full h-12 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted/50 rounded-xl"
            >
              Enter Address Manually
            </Button>
          </div>
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
