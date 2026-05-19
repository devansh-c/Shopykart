
"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Store, 
  Layers, 
  ShoppingBag, 
  Settings,
  LogOut,
  ChevronRight,
  MessageSquare,
  Tag,
  BellRing,
  Menu as MenuIcon,
  CheckCircle2,
  Percent,
  Feather,
  Globe,
  RefreshCw,
  Timer,
  AlertOctagon,
  RefreshCcw,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

// Admin Sub-components
import { AdminOverview } from '@/components/admin/AdminOverview';
import { ProductManagement } from '@/components/admin/ProductManagement';
import { BannerManagement } from '@/components/admin/BannerManagement';
import { OrderManagement } from '@/components/admin/OrderManagement';
import { ReviewManagement } from '@/components/admin/ReviewManagement';
import { DiscountManagement } from '@/components/admin/DiscountManagement';
import { StoreManagement } from '@/components/admin/StoreManagement';
import { CategoryManagement } from '@/components/admin/CategoryManagement';
import { BrandingManagement } from '@/components/admin/BrandingManagement';
import { NotificationManagement } from '@/components/admin/NotificationManagement';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'stores', label: 'Stores', icon: Store },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'catalog', label: 'Catalog', icon: Layers },
  { id: 'design', label: 'Banners', icon: Feather },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'discounts', label: 'Discounts', icon: Percent },
  { id: 'notifications', label: 'Notifications', icon: BellRing },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  { id: 'settings', label: 'Branding & SEO', icon: Settings },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 flex items-center space-x-3 border-b border-border/30">
        <div className="bg-primary p-2 rounded-xl text-white">
          <LayoutDashboard className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-black italic leading-none">SHOPYKART</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
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
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* BLUE PAGE KILLER ALERT */}
            <div className="bg-red-50 border-2 border-red-200 p-8 rounded-[2.5rem] shadow-sm animate-in zoom-in duration-500">
               <div className="flex items-center gap-4 mb-6">
                  <div className="bg-red-500 p-4 rounded-3xl text-white shadow-lg shadow-red-200">
                    <AlertOctagon className="h-8 w-8 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black italic uppercase text-red-900 leading-none">RECOVERY MODE V11 ACTIVE</h2>
                    <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest mt-2">Status: Forcing Static Release...</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/80 p-6 rounded-3xl border border-red-100">
                    <h4 className="text-xs font-black uppercase text-red-800 mb-3 flex items-center gap-2">
                       <CheckCircle2 className="h-3 w-3" /> CUSTOMER KO YE BOLO:
                    </h4>
                    <ul className="list-disc ml-5 space-y-2 text-[11px] font-bold text-gray-700 uppercase leading-relaxed">
                      <li>Website live hai, lekin aapka phone purana page yaad rakhta hai.</li>
                      <li><span className="text-red-600 underline font-black">SOLTUION:</span> Chrome mein 3 dots par click karke <strong>"New Incognito Tab"</strong> kholiye.</li>
                      <li>Agar site blue dikhe, toh apne phone ki "Settings > Apps > Chrome > Clear Cache" kijiye.</li>
                    </ul>
                  </div>

                  <div className="bg-white/80 p-6 rounded-3xl border border-blue-100">
                    <h4 className="text-xs font-black uppercase text-blue-800 mb-3 flex items-center gap-2">
                       <Smartphone className="h-3 w-3" /> TESTING STEPS:
                    </h4>
                    <div className="space-y-3">
                       <p className="text-[10px] font-bold text-gray-600 uppercase">1. GoDaddy check kijiye (TTL 600 fixed?)</p>
                       <p className="text-[10px] font-bold text-gray-600 uppercase">2. 5 Minute wait kijiye (Files sync ho rahi hain)</p>
                       <p className="text-[10px] font-bold text-gray-600 uppercase">3. Dusre naye phone par site check karein</p>
                    </div>
                  </div>
               </div>
            </div>

            <AdminOverview />
          </div>
        );
      case 'stores':
        return <StoreManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'catalog':
        return <ProductManagement />;
      case 'design':
        return <BannerManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'reviews':
        return <ReviewManagement />;
      case 'discounts':
        return <DiscountManagement />;
      case 'notifications':
        return <NotificationManagement />;
      case 'settings':
        return <BrandingManagement />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col md:flex-row">
      {/* Emergency Deployment Banner */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-4 text-center">
         <RefreshCcw className="h-4 w-4 animate-spin hidden sm:block" />
         <span className="text-[10px] font-black uppercase tracking-widest italic">
           FINAL PRODUCTION SYNC V11.0 • DO NOT REBOOT
         </span>
      </div>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-border/50 px-4 py-4 mt-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="bg-primary p-2 rounded-xl text-white">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <h1 className="text-sm font-black italic">SHOPYKART ADMIN</h1>
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <MenuIcon className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SheetHeader className="sr-only">
              <SheetTitle>Admin Navigation Menu</SheetTitle>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-border/50 flex-col sticky top-0 h-screen pt-8">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full pt-16">
        <header className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-black italic uppercase">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h2>
          <p className="text-muted-foreground text-xs md:text-sm font-medium">Manage your business operations securely on Spark Plan.</p>
        </header>

        <div className="pb-10">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
