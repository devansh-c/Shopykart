'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const MapPicker = dynamic(() => import('./MapPicker'), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-muted animate-pulse rounded-3xl" />
});

/**
 * Standard Point-in-Polygon Algorithm
 */
function isPointInPolygon(lat: number, lng: number, vs: any[]) {
  if (!vs || !Array.isArray(vs) || vs.length < 3) return false;
  const x = Number(lng);
  const y = Number(lat);
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = Number(vs[i].lng ?? vs[i].longitude ?? (Array.isArray(vs[i]) ? vs[i][1] : 0));
    const yi = Number(vs[i].lat ?? vs[i].latitude ?? (Array.isArray(vs[i]) ? vs[i][0] : 0));
    const xj = Number(vs[j].lng ?? vs[j].longitude ?? (Array.isArray(vs[j]) ? vs[j][1] : 0));
    const yj = Number(vs[j].lat ?? vs[j].latitude ?? (Array.isArray(vs[j]) ? vs[j][0] : 0));
    
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function LocationRequest() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'zones'), where('isActive', '==', true));
  }, [firestore]);
  const { data: zones } = useCollection<any>(zonesQuery);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-location-picker', handleOpen);
    
    // Auto-open if location is not set for first-time users
    const isSet = localStorage.getItem('user_location_set');
    if (!isSet) {
      const timer = setTimeout(() => setIsOpen(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('open-location-picker', handleOpen);
      };
    }

    return () => window.removeEventListener('open-location-picker', handleOpen);
  }, []);

  const handleConfirm = async (lat: number, lng: number) => {
    const matchedZone = zones?.find(zone => isPointInPolygon(lat, lng, zone.boundary || []));
    
    if (matchedZone) {
      // Save precise coordinates
      localStorage.setItem('user_plus_code', `${lat},${lng}`);
      localStorage.setItem('user_city', matchedZone.city || 'Local');
      localStorage.setItem('user_address', matchedZone.name);
      localStorage.setItem('active_zone_id', matchedZone.id);
      localStorage.setItem('user_location_set', 'true');

      if (user && firestore) {
        try {
          await setDoc(doc(firestore, 'users', user.uid), {
            latitude: lat,
            longitude: lng,
            city: matchedZone.city || 'Local',
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (e) {
          console.error("Profile location sync error:", e);
        }
      }

      window.dispatchEvent(new CustomEvent('user-address-updated'));
      toast({ title: "Location Set!", description: `Welcome to ShopyKart ${matchedZone.city}.` });
      setIsOpen(false);
    } else {
      toast({ 
        variant: "destructive", 
        title: "Service Unavailable", 
        description: "Sorry, this area is currently outside our delivery zone." 
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="rounded-[2.5rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl h-[520px] focus:outline-none">
        <DialogHeader className="p-6 bg-white border-b sticky top-0 z-50">
          <DialogTitle className="font-black italic uppercase text-center text-lg">Select Delivery Area</DialogTitle>
        </DialogHeader>
        <div className="flex-1 h-full">
          <MapPicker onConfirm={handleConfirm} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
