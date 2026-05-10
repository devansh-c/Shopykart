
"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShoppingBag, LayoutDashboard, Package, Tag, LogOut, TrendingUp, Users, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Admin Sub-components
import { AdminOverview } from '@/components/admin/AdminOverview';
import { ProductManagement } from '@/components/admin/ProductManagement';
import { BannerManagement } from '@/components/admin/BannerManagement';
import { OrderManagement } from '@/components/admin/OrderManagement';

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth !== 'true') {
      router.push('/admin/login');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem('admin_auth');
    toast({ title: "Logged Out", description: "You have been signed out." });
    router.push('/');
  };

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      {/* Sidebar/Header */}
      <header className="bg-white border-b border-border/50 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-primary p-2 rounded-xl text-white">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black italic">ADMIN PANEL</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ShopyKart Control Center</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-red-500 font-bold">
          <LogOut className="h-4 w-4 mr-2" />
          EXIT
        </Button>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border p-1 rounded-2xl h-auto flex-wrap sm:flex-nowrap justify-start">
            <TabsTrigger value="overview" className="rounded-xl font-bold px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="products" className="rounded-xl font-bold px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Package className="h-4 w-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="banners" className="rounded-xl font-bold px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Tag className="h-4 w-4 mr-2" />
              Banners
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl font-bold px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="focus-visible:outline-none">
            <AdminOverview />
          </TabsContent>

          <TabsContent value="products" className="focus-visible:outline-none">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="banners" className="focus-visible:outline-none">
            <BannerManagement />
          </TabsContent>

          <TabsContent value="orders" className="focus-visible:outline-none">
            <OrderManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
