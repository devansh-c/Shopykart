"use client"

import { BottomNav } from '@/components/shared/BottomNav';
import { ShoppingBag, ChevronRight, Clock } from 'lucide-react';

const orders = [
  { id: 'ORD-5542', status: 'Delivering', date: 'Just now', total: 24.50, items: 2 },
  { id: 'ORD-4321', status: 'Completed', date: 'Oct 24, 2023', total: 18.25, items: 1 },
  { id: 'ORD-1290', status: 'Completed', date: 'Oct 20, 2023', total: 45.00, items: 3 },
];

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-12 pb-6">
        <h1 className="text-3xl font-black">My Orders</h1>
      </div>

      <div className="px-4 space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="premium-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "h-10 w-10 rounded-2xl flex items-center justify-center",
                  order.status === 'Delivering' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{order.id}</h3>
                  <div className="flex items-center text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    <Clock className="h-3 w-3 mr-1" />
                    {order.date}
                  </div>
                </div>
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase px-2 py-1 rounded-full",
                order.status === 'Delivering' ? "bg-green-100 text-green-700 animate-pulse" : "bg-gray-100 text-gray-600"
              )}>
                {order.status}
              </span>
            </div>
            
            <div className="border-t border-border/50 pt-3 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground">{order.items}</span> items • Total <span className="font-bold text-foreground">${order.total.toFixed(2)}</span>
              </div>
              <button className="flex items-center text-xs font-bold text-primary hover:underline">
                View Details
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}

import { cn } from '@/lib/utils';