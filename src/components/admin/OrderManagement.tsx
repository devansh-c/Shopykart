
"use client"

import { useState } from 'react';
import { ShoppingBag, ChevronRight, Clock, CheckCircle2, Truck, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const initialOrders = [
  { id: 'ORD-5542', status: 'Preparing', date: 'Just now', total: 24.50, customer: 'John Doe', items: '2x Veg Burger' },
  { id: 'ORD-4321', status: 'Delivered', date: 'Oct 24, 2023', total: 18.25, customer: 'Jane Smith', items: '1x Margherita Pizza' },
  { id: 'ORD-1290', status: 'Out for Delivery', date: 'Oct 20, 2023', total: 45.00, customer: 'Robert Brown', items: '3x Pasta Combo' },
];

export function OrderManagement() {
  const [orders, setOrders] = useState(initialOrders);
  const { toast } = useToast();

  const handleStatusUpdate = (id: string, status: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    toast({ title: "Order Updated", description: `Order ${id} is now ${status}.` });
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Preparing': return Timer;
      case 'Out for Delivery': return Truck;
      case 'Delivered': return CheckCircle2;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black italic">ACTIVE ORDERS</h2>
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Showing {orders.length} orders</div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => {
          const Icon = getStatusIcon(order.status);
          return (
            <div key={order.id} className="bg-white p-5 rounded-2xl border hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center",
                    order.status === 'Preparing' ? "bg-amber-100 text-amber-600" : 
                    order.status === 'Out for Delivery' ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="font-black text-base">{order.id}</h3>
                      <span className="text-xs text-muted-foreground font-bold">• {order.customer}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">{order.items}</p>
                    <div className="flex items-center text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      <Clock className="h-3 w-3 mr-1" />
                      {order.date} • <span className="text-foreground ml-1">₹{order.total}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Select 
                    defaultValue={order.status} 
                    onValueChange={(val) => handleStatusUpdate(order.id, val)}
                  >
                    <SelectTrigger className="w-[180px] rounded-xl font-bold text-xs h-10 border-muted">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Preparing" className="font-bold text-xs">Preparing</SelectItem>
                      <SelectItem value="Out for Delivery" className="font-bold text-xs">Out for Delivery</SelectItem>
                      <SelectItem value="Delivered" className="font-bold text-xs">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
