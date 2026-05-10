
"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Store, 
  Bike, 
  Rocket, 
  Layers, 
  ShoppingBag, 
  Users, 
  LineChart, 
  Percent, 
  Feather, 
  Zap, 
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Admin Sub-components
import { AdminOverview } from '@/components/admin/AdminOverview';
import { ProductManagement } from '@/components/admin/ProductManagement';
import { BannerManagement } from '@/components/admin/BannerManagement';
import { OrderManagement } from '@/components/admin/OrderManagement';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'stores', label: 'Stores', icon: Store },
  { id: 'fleet', label: 'Delivery Fleet', icon: Bike },
  { id: 'mission', label: 'Mission Control', icon: Rocket },
  { id: 'catalog', label: 'Catalog', icon: Layers },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'reports', label: 'Reports', icon: LineChart },
  { id: 'discounts', label: 'Discounts', icon: Percent },
  { id: 'design', label: 'Design', icon: Feather },
  { id: 'plugins', label: 'Plugins', icon: Zap },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminOverview />;
      case 'catalog':
        return <ProductManagement />;
      case 'design':
        return <BannerManagement />;
      case 'orders':
        return <OrderManagement />;
      default: {
        const activeItem = menuItems.find(i => i.id === activeTab);
        const Icon = activeItem?.icon;
        return (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-muted-foreground/20">
            <div className="h-16 w-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
              {Icon && <Icon className="h-8 w-8 text-muted-foreground" />}
            </div>
            <h3 className="text-xl font-black italic uppercase">Module Coming Soon</h3>
            <p className="text-muted-foreground text-sm font-medium">
              The {activeItem?.label || 'selected'} section is under development.
            </p>
          </div>
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border/50 flex flex-col sticky top-0 h-screen overflow-y-auto no-scrollbar">
        <div className="p-6 flex items-center space-x-3 border-b border-border/30">
          <div className="bg-primary p-2 rounded-xl text-white">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-black italic leading-none">SHOPYKART</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
                  <span className="text-sm font-bold">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="h-4 w-4" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/30">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut} 
            className="w-full justify-start text-red-500 font-bold hover:bg-red-50 hover:text-red-600 rounded-xl"
          >
            <LogOut className="h-4 w-4 mr-2" />
            EXIT PANEL
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        <header className="mb-8">
          <h2 className="text-3xl font-black italic uppercase">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Manage and monitor your business operations here.</p>
        </header>

        {renderContent()}
      </main>
    </div>
  );
}
