
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, updateDoc, query, where } from 'firebase/firestore';
import { Loader2, Navigation, Package, CheckCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function DeliveryDashboard() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const tasksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'orders'), where('status', 'in', ['Ready for Pickup', 'Picked Up', 'Out for Delivery']));
  }, [firestore]);

  const { data: tasks, loading } = useCollection<any>(tasksQuery);

  const updateDelivery = (orderId: string, status: string) => {
    if (!firestore || !user) return;
    const ref = doc(firestore, 'orders', orderId);
    updateDoc(ref, { 
      status: status,
      deliveryPartnerId: user.uid 
    }).then(() => toast({ title: "Updated", description: `Order is now ${status}` }));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white p-6 pb-24">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Delivery Hub</h1>
          <div className="bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30 flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Online</span>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        {tasks?.map((task) => (
          <div key={task.id} className="bg-white/5 backdrop-blur-md rounded-[2rem] p-6 border border-white/10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">{task.status}</span>
                <h3 className="font-black italic text-lg leading-none mt-2">PICKUP #{task.id.slice(-4)}</h3>
                <div className="flex items-center gap-2 mt-2 text-gray-400 text-xs">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{task.address}</span>
                </div>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl"><Navigation className="h-6 w-6 text-primary" /></div>
            </div>

            {task.status === 'Ready for Pickup' && (
              <Button onClick={() => updateDelivery(task.id, 'Picked Up')} className="w-full bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase italic h-14 text-lg">Accept & Pickup</Button>
            )}
            {task.status === 'Picked Up' && (
              <Button onClick={() => updateDelivery(task.id, 'Out for Delivery')} className="w-full bg-blue-500 hover:bg-blue-600 rounded-2xl font-black uppercase italic h-14 text-lg">Mark Out for Delivery</Button>
            )}
            {task.status === 'Out for Delivery' && (
              <Button onClick={() => updateDelivery(task.id, 'Delivered')} className="w-full bg-green-500 hover:bg-green-600 rounded-2xl font-black uppercase italic h-14 text-lg">Confirm Delivery</Button>
            )}
          </div>
        ))}

        {(!tasks || tasks.length === 0) && (
          <div className="text-center py-20 opacity-30 flex flex-col items-center">
            <Package className="h-16 w-16 mb-4" />
            <p className="font-black italic uppercase tracking-widest text-sm">No tasks available</p>
          </div>
        )}
      </div>
    </div>
  );
}
