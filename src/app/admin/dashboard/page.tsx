
"use client"

import { useEffect, useState, useRef } from 'react';
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
  Percent,
  Feather,
  Users,
  Receipt,
  CircleDollarSign,
  Truck,
  Megaphone,
  Download,
  MapPin,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

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
import { CustomerManagement } from '@/components/admin/CustomerManagement';
import { ChargeManagement } from '@/components/admin/ChargeManagement';
import { StorePayoutManagement } from '@/components/admin/StorePayoutManagement';
import { FleetManagement } from '@/components/admin/FleetManagement';
import { MonetizationManagement } from '@/components/admin/MonetizationManagement';
import { ExportManagement } from '@/components/admin/ExportManagement';
import { ZoneManagement } from '@/components/admin/ZoneManagement';
import { PageManagement } from '@/components/admin/PageManagement';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'zones', label: 'Serving Zones', icon: MapPin },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'stores', label: 'Stores', icon: Store },
  { id: 'fleet', label: 'Delivery Fleet', icon: Truck },
  { id: 'payouts', label: 'Store Payouts', icon: CircleDollarSign },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'catalog', label: 'Catalog', icon: Layers },
  { id: 'design', label: 'Banners', icon: Feather },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'discounts', label: 'Discounts', icon: Percent },
  { id: 'charges', label: 'Tax & Charges', icon: Receipt },
  { id: 'ads', label: 'Monetization', icon: Megaphone },
  { id: 'notifications', label: 'Notifications', icon: BellRing },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  { id: 'pages', label: 'Policy Pages', icon: FileText },
  { id: 'export', label: 'Export & Backup', icon: Download },
  { id: 'settings', label: 'Branding & SEO', icon: Settings },
];

function SidebarContent({ activeTab, setActiveTab, onSignOut, onCloseMobile }: { 
  activeTab: string, 
  setActiveTab: (id: string) => void, 
  onSignOut: () => void,
  onCloseMobile: () => void
}) {
  return (
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
                onCloseMobile();
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
          onClick={onSignOut} 
          className="w-full justify-start text-red-500 font-bold hover:bg-red-50 hover:text-red-600 rounded-xl"
        >
          <LogOut className="h-4 w-4 mr-2" />
          EXIT PANEL
        </Button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const firestore = useFirestore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showOrderAlert, setShowOrderAlert] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth !== 'true') {
      router.push('/admin/login');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  // ALARM LOGIC FOR ADMIN
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'orders'), where('status', '==', 'Placed'));
  }, [firestore]);
  const { data: newOrders } = useCollection<any>(ordersQuery);

  useEffect(() => {
    if (newOrders && newOrders.length > 0 && isAuthorized) {
      setShowOrderAlert(true);
      if (!audioRef.current) {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(() => console.log("Audio play blocked"));
    } else {
      setShowOrderAlert(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, [newOrders, isAuthorized]);

  const handleSignOut = () => {
    localStorage.removeItem('admin_auth');
    router.push('/');
  };

  if (!isAuthorized) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminOverview />;
      case 'zones':
        return <ZoneManagement />;
      case 'customers':
        return <CustomerManagement />;
      case 'stores':
        return <StoreManagement />;
      case 'fleet':
        return <FleetManagement />;
      case 'payouts':
        return <StorePayoutManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'catalog':
        return <ProductManagement />;
      case 'design':
        return <BannerManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'discounts':
        return <DiscountManagement />;
      case 'charges':
        return <ChargeManagement />;
      case 'ads':
        return <MonetizationManagement />;
      case 'notifications':
        return <NotificationManagement />;
      case 'reviews':
        return <ReviewManagement />;
      case 'pages':
        return <PageManagement />;
      case 'export':
        return <ExportManagement />;
      case 'settings':
        return <BrandingManagement />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col md:flex-row">
      {/* NEW ORDER ALARM OVERLAY FOR ADMIN */}
      <Dialog open={showOrderAlert} onOpenChange={setShowOrderAlert}>
        <DialogContent className="rounded-[3rem] max-w-sm bg-[#0B0B0B] text-center border-primary/20">
          <DialogHeader>
            <DialogTitle className="sr-only">New Order Alert</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 p-4">
            <BellRing className="h-12 w-12 text-primary animate-bounce" />
            <h2 className="text-3xl font-black italic uppercase text-white">NEW ORDER ARRIVED!</h2>
            <DialogDescription className="text-gray-400 font-bold text-xs uppercase">A new order is pending in the network.</DialogDescription>
            <Button 
              onClick={() => {
                setShowOrderAlert(false);
                setActiveTab('orders');
              }} 
              className="w-full h-14 bg-white text-black rounded-2xl font-black italic text-lg shadow-xl"
            >
              VIEW ORDERS
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-border/50 px-4 py-4 flex items-center justify-between sticky top-0 z-50">
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
            <SidebarContent 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              onSignOut={handleSignOut} 
              onCloseMobile={() => setIsMobileMenuOpen(false)} 
            />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-border/50 flex-col sticky top-0 h-screen">
        <SidebarContent 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onSignOut={handleSignOut} 
          onCloseMobile={() => {}} 
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <header className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-black italic uppercase">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h2>
          <p className="text-muted-foreground text-xs md:text-sm font-medium">Secure business operations management.</p>
        </header>

        <div className="pb-10">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
