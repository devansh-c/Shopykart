"use client"

import { BottomNav } from '@/components/shared/BottomNav';
import { ShoppingBag, ChevronRight, Clock, MapPin, Package, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const orders = [
  { 
    id: 'ORD-5542', 
    status: 'In Transit', 
    date: 'Today, 2:45 PM', 
    total: 399.00, 
    items: ['Margherita Pizza', 'Virgin Mojito'],
    address: '123, Skyline Apartments, Mumbai'
  },
  { 
    id: 'ORD-4321', 
    status: 'Delivered', 
    date: 'Oct 24, 2023', 
    total: 249.00, 
    items: ['Chilli Attack Pasta'],
    address: '45, Royal Enclave, Mumbai'
  },
  { 
    id: 'ORD-1290', 
    status: 'Delivered', 
    date: 'Oct 20, 2023', 
    total: 899.00, 
    items: ['Family Feast Combo'],
    address: '12, Sunrise Residency, Mumbai'
  },
];

export default function OrdersPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-32">
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">My Orders</h1>
      </div>

      <div className="px-4 space-y-5">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-[2rem] p-6 border border-border/40 shadow-sm active:scale-[0.98] transition-all group">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center",
                  order.status === 'In Transit' ? "bg-primary/10 text-primary shadow-lg shadow-primary/5" : "bg-muted text-muted-foreground"
                )}>
                  <Package className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-black text-lg italic tracking-tight">{order.id}</h3>
                  <div className="flex items-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                    <Clock className="h-3 w-3 mr-1" />
                    {order.date}
                  </div>
                </div>
              </div>
              <div className={cn(
                "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                order.status === 'In Transit' 
                  ? "bg-green-100 text-green-700 animate-pulse border border-green-200" 
                  : "bg-gray-100 text-gray-500 border border-gray-200"
              )}>
                {order.status}
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3 text-xs">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground font-medium line-clamp-1">{order.address}</span>
              </div>
              <div className="bg-muted/50 rounded-2xl p-4 space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-foreground">1x {item}</span>
                    <span className="text-muted-foreground">Included</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-dashed border-border pt-5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Paid</span>
                <span className="text-xl font-black text-foreground italic tracking-tight">₹{order.total.toFixed(2)}</span>
              </div>
              <button 
                onClick={() => router.push(`/orders/${order.id}`)}
                className="bg-[#0B0B0B] text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center hover:bg-primary transition-colors"
              >
                Track Order
                <ChevronRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
