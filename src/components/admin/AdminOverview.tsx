
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, ShoppingCart, IndianRupee, MousePointerClick } from 'lucide-react';

export function AdminOverview() {
  const stats = [
    { label: 'Total Revenue', value: '₹48,250', icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Total Orders', value: '1,240', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Registered Users', value: '850', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Abandoned Carts', value: '45', icon: MousePointerClick, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2 rounded-xl`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{stat.value}</div>
              <p className="text-[10px] text-green-500 font-bold mt-1">+12% from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-4">Quick Insights</h3>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted rounded-2xl bg-muted/20">
          <p className="text-muted-foreground text-sm font-medium">Sales chart and analytics data visualization will appear here.</p>
        </div>
      </Card>
    </div>
  );
}
