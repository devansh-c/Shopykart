
'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2, CheckCircle2 } from 'lucide-react';
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
      const timer = setTimeout(() => setOpen(true), 1500);
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

            setDoc(userRef, locationData, { merge: true })
              .catch(async (err) => {
                const permissionError = new FirestorePermissionError({
                  path: userRef.path,
                  operation: 'update',
                  requestResourceData: locationData,
                });
                errorEmitter.emit('permission-error', permissionError);
              });

            localStorage.setItem('user_address', address);
            localStorage.setItem('user_location_set', 'true');
            
            setSuccess(true);
            setTimeout(() => {
              setOpen(false);
              setSuccess(false);
              window.location.reload(); 
            }, 1500);
          }
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not fetch your address.',
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
      <DialogContent className="rounded-[2.5rem] max-w-sm border-none shadow-2xl overflow-hidden z-[150]">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
        <DialogHeader className="pt-6">
          <div className="mx-auto bg-primary/10 h-20 w-20 rounded-full flex items-center justify-center mb-4">
            {success ? (
              <CheckCircle2 className="h-10 w-10 text-green-500 animate-in zoom-in" />
            ) : (
              <MapPin className="h-10 w-10 text-primary animate-bounce" />
            )}
          </div>
          <DialogTitle className="text-2xl font-black italic uppercase text-center tracking-tighter">
            Where should we deliver?
          </DialogTitle>
          <DialogDescription className="text-center font-medium text-muted-foreground px-4">
            Grant location access to see the best restaurants and deals near you.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-3 pb-4">
          <Button
            onClick={handleGetLocation}
            disabled={loading || success}
            className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase italic tracking-tighter shadow-xl shadow-primary/20"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : success ? (
              'Location Set!'
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                USE CURRENT LOCATION
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="w-full h-10 text-xs font-bold uppercase tracking-widest text-muted-foreground"
          >
            Enter location manually
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
