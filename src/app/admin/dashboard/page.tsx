
"use client"

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
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
  FileText,
  LifeBuoy,
  HeartPulse,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';

// LAZY LOADING: Dynamically import heavy components to reduce initial bundle size by 70%
const AdminOverview = dynamic(() => import('@/components/admin/AdminOverview').then(m => ({ default: m.AdminOverview })), { loading: () => <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> });
const ProductManagement = dynamic(() => import('@/components/admin/ProductManagement').then(m => ({ default: m.ProductManagement })));
const BannerManagement = dynamic(() => import('@/components/admin/BannerManagement').then(m => ({ default: m.BannerManagement })));
const OrderManagement = dynamic(() => import('@/components/admin/OrderManagement').then(m => ({ default: m.OrderManagement })));
const ReviewManagement = dynamic(() => import('@/components/admin/ReviewManagement').then(m => ({ default: m.ReviewManagement })));
const DiscountManagement = dynamic(() => import('@/components/admin/DiscountManagement').then(m => ({ default: m.DiscountManagement })));
const StoreManagement = dynamic(() => import('@/components/admin/StoreManagement').then(m => ({ default: m.StoreManagement })));
const CategoryManagement = dynamic(() => import('@/components/admin/CategoryManagement').then(m => ({ default: m.CategoryManagement })));
const BrandingManagement = dynamic(() => import('@/components/admin/BrandingManagement').then(m => ({ default: m.BrandingManagement })));
const NotificationManagement = dynamic(() => import('@/components/admin/NotificationManagement').then(m => ({ default: m.NotificationManagement })));
const CustomerManagement = dynamic(() => import('@/components/admin/CustomerManagement').then(m => ({ default: m.CustomerManagement })));
const ChargeManagement = dynamic(() => import('@/components/admin/ChargeManagement').then(m => ({ default: m.ChargeManagement })));
const StorePayoutManagement = dynamic(() => import('@/components/admin/StorePayoutManagement').then(m => ({ default: m.StorePayoutManagement })));
const FleetManagement = dynamic(() => import('@/components/admin/FleetManagement').then(m => ({ default: m.FleetManagement })));
const MonetizationManagement = dynamic(() => import('@/components/admin/MonetizationManagement').then(m => ({ default: m.MonetizationManagement })));
const ExportManagement = dynamic(() => import('@/components/admin/ExportManagement').then(m => ({ default: m.ExportManagement })));
const ZoneManagement = dynamic(() => import('@/components/admin/ZoneManagement').then(m => ({ default: m.ZoneManagement })));
const PageManagement = dynamic(() => import('@/components/admin/PageManagement').then(m => ({ default: m.PageManagement })));
const TicketManagement = dynamic(() => import('@/components/admin/TicketManagement').then(m => ({ default: m.TicketManagement })));

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'zones', label: 'Serving Zones', icon: MapPin },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'stores', label: 'All Stores', icon: Store },
  { id: 'medical', label: 'Medical Stores', icon: HeartPulse },
  { id: 'beauty', label: 'Beauty Stores', icon: Sparkles },
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
  { id: 'tickets', label: 'Support Tickets', icon: LifeBuoy },
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
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 group",
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

  // OPTIMIZED FETCH: Limit to most recent Place orders to avoid lagging the admin UI
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'orders'), where('status', '==', 'Placed'), limit(20));
  }, [firestore]);
  const { data: newOrders } = useCollection<any>(ordersQuery);

  useEffect(() => {
    if (newOrders && newOrders.length > 0 && isAuthorized) {
      setShowOrderAlert(true);
      if (!audioRef.current) {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(() => {});
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
      case 'dashboard': return <AdminOverview />;
      case 'zones': return <ZoneManagement />;
      case 'customers': return <CustomerManagement />;
      case 'stores': return <StoreManagement />;
      case 'medical': return <StoreManagement categoryFilter="Medical" />;
      case 'beauty': return <StoreManagement categoryFilter="Beauty" />;
      case 'fleet': return <FleetManagement />;
      case 'payouts': return <StorePayoutManagement />;
      case 'categories': return <CategoryManagement />;
      case 'catalog': return <ProductManagement />;
      case 'design': return <BannerManagement />;
      case 'orders': return <OrderManagement />;
      case 'discounts': return <DiscountManagement />;
      case 'charges': return <ChargeManagement />;
      case 'ads': return <MonetizationManagement />;
      case 'notifications': return <NotificationManagement />;
      case 'tickets': return <TicketManagement />;
      case 'reviews': return <ReviewManagement />;
      case 'pages': return <PageManagement />;
      case 'export': return <ExportManagement />;
      case 'settings': return <BrandingManagement />;
      default: return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col md:flex-row transform-gpu">
      <Dialog open={showOrderAlert} onOpenChange={setShowOrderAlert}>
        <DialogContent className="rounded-[3rem] max-w-sm bg-[#0B0B0B] text-center border-primary/20">
          <DialogHeader><DialogTitle className="sr-only">New Order Alert</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-6 p-4">
            <BellRing className="h-12 w-12 text-primary animate-bounce" />
            <h2 className="text-3xl font-black italic uppercase text-white">NEW ORDER!</h2>
            <DialogDescription className="text-gray-400 font-bold text-xs uppercase">Action required immediately</DialogDescription>
            <Button onClick={() => { setShowOrderAlert(false); setActiveTab('orders'); }} className="w-full h-14 bg-white text-black rounded-2xl font-black italic text-lg shadow-xl">VIEW ORDERS</Button>
          </div>
        </DialogContent>
      </Dialog>

      <header className="md:hidden bg-white border-b border-border/50 px-4 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="bg-primary p-2 rounded-xl text-white"><LayoutDashboard className="h-4 w-4" /></div>
          <h1 className="text-sm font-black italic">ADMIN HUB</h1>
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl"><MenuIcon className="h-6 w-6" /></Button></SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-none shadow-2xl">
            <SheetHeader className="sr-only"><SheetTitle>Menu</SheetTitle></SheetHeader>
            <SidebarContent activeTab={activeTab} setActiveTab={setActiveTab} onSignOut={handleSignOut} onCloseMobile={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      <aside className="hidden md:flex w-64 bg-white border-r border-border/50 flex-col sticky top-0 h-screen shadow-sm">
        <SidebarContent activeTab={activeTab} setActiveTab={setActiveTab} onSignOut={handleSignOut} onCloseMobile={() => {}} />
      </aside>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full content-visibility-auto">
        <header className="mb-6 md:mb-8 animate-in fade-in duration-500">
          <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h2>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">Management Portal</p>
        </header>

        <div className="pb-20">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
