"use client"

import { useEffect, useState, memo, useTransition, useMemo } from 'react';
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
  Loader2,
  ShieldCheck,
  UserPlus,
  ShieldAlert,
  FileSpreadsheet,
  Zap,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useFirestore } from '@/firebase';
import { requestPushToken } from '@/firebase/messaging';

// IMPORTING CRITICAL COMPONENTS DIRECTLY TO PREVENT CHUNK ERRORS
import AdminOverview from '@/components/admin/AdminOverview';
import OrderManagement from '@/components/admin/OrderManagement';
import ProductManagement from '@/components/admin/ProductManagement';
import StoreManagement from '@/components/admin/StoreManagement';

// DYNAMIC IMPORTS FOR SECONDARY PAGES
const GlobalOfferManagement = dynamic(() => import('@/components/admin/GlobalOfferManagement'), { ssr: false });
const BannerManagement = dynamic(() => import('@/components/admin/BannerManagement'), { ssr: false });
const ReviewManagement = dynamic(() => import('@/components/admin/ReviewManagement'), { ssr: false });
const DiscountManagement = dynamic(() => import('@/components/admin/DiscountManagement'), { ssr: false });
const CategoryManagement = dynamic(() => import('@/components/admin/CategoryManagement'), { ssr: false });
const BrandingManagement = dynamic(() => import('@/components/admin/BrandingManagement'), { ssr: false });
const CustomerManagement = dynamic(() => import('@/components/admin/CustomerManagement'), { ssr: false });
const ChargeManagement = dynamic(() => import('@/components/admin/ChargeManagement'), { ssr: false });
const StorePayoutManagement = dynamic(() => import('@/components/admin/StorePayoutManagement'), { ssr: false });
const FleetManagement = dynamic(() => import('@/components/admin/FleetManagement'), { ssr: false });
const MonetizationManagement = dynamic(() => import('@/components/admin/MonetizationManagement'), { ssr: false });
const ExportManagement = dynamic(() => import('@/components/admin/ExportManagement'), { ssr: false });
const ZoneManagement = dynamic(() => import('@/components/admin/ZoneManagement'), { ssr: false });
const PageManagement = dynamic(() => import('@/components/admin/PageManagement'), { ssr: false });
const TicketManagement = dynamic(() => import('@/components/admin/TicketManagement'), { ssr: false });
const TeamManagement = dynamic(() => import('@/components/admin/TeamManagement'), { ssr: false });
const ReceiptGenerator = dynamic(() => import('@/components/admin/ReceiptGenerator'), { ssr: false });
const PremiumUserManagement = dynamic(() => import('@/components/admin/PremiumUserManagement'), { ssr: false });

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'premium_users', label: 'Premium Users', icon: Crown },
  { id: 'global_offer', label: 'Flash Sale (Store-wide)', icon: Zap },
  { id: 'receipt_gen', label: 'Receipt Generator', icon: FileSpreadsheet },
  { id: 'zones', label: 'Serving Zones', icon: MapPin },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'stores', label: 'All Stores', icon: Store },
  { id: 'medical', label: 'Medical Stores', icon: HeartPulse },
  { id: 'beauty', label: 'Beauty Stores', icon: Sparkles },
  { id: 'fleet', label: 'Delivery Fleet', icon: Truck },
  { id: 'payouts', label: 'Store Payouts', icon: CircleDollarSign },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'products', label: 'Products', icon: Layers },
  { id: 'design', label: 'Banners', icon: Feather },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'discounts', label: 'Coupons', icon: Percent },
  { id: 'charges', label: 'Tax & Charges', icon: Receipt },
  { id: 'ads', label: 'Monetization', icon: Megaphone },
  { id: 'tickets', label: 'Support Tickets', icon: LifeBuoy },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  { id: 'pages', label: 'Policy Pages', icon: FileText },
  { id: 'team', label: 'Team Members', icon: UserPlus },
  { id: 'export', label: 'Export & Backup', icon: Download },
  { id: 'settings', label: 'Branding & SEO', icon: Settings },
];

const SidebarContent = memo(({ activeTab, onTabSelect, onSignOut, onCloseMobile, allowedFeatures }: any) => {
  const isMasterAdmin = allowedFeatures === 'all';
  const filteredMenu = isMasterAdmin 
    ? menuItems 
    : menuItems.filter(item => Array.isArray(allowedFeatures) && (allowedFeatures.includes(item.id) || item.id === 'dashboard'));

  return (
    <div className="flex flex-col h-full bg-white transform-gpu">
      <div className="p-6 flex items-center space-x-3 border-b border-border/30">
        <div className={cn("p-2 rounded-xl text-white", isMasterAdmin ? "bg-black" : "bg-primary")}>
          {isMasterAdmin ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
        </div>
        <div>
          <h1 className="text-lg font-black italic leading-none">SHOPYKART</h1>
          <p className={cn("text-[10px] font-black uppercase tracking-widest mt-1", isMasterAdmin ? "text-black" : "text-primary")}>
            {isMasterAdmin ? 'MASTER ADMIN' : 'STAFF ACCESS'}
          </p>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { onTabSelect(item.id); onCloseMobile(); }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 group",
                isActive ? (isMasterAdmin ? "bg-black text-white" : "bg-primary text-white shadow-lg shadow-primary/20") : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
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
        <Button variant="ghost" size="sm" onClick={onSignOut} className="w-full justify-start text-red-500 font-bold hover:bg-red-50 hover:text-red-600 rounded-xl">
          <LogOut className="h-4 w-4 mr-2" /> EXIT PANEL
        </Button>
      </div>
    </div>
  );
});
SidebarContent.displayName = "SidebarContent";

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPending, startTransition] = useTransition();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifyBanner, setShowNotifyBanner] = useState(false);
  const [allowedFeatures, setAllowedFeatures] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const auth = localStorage.getItem('admin_auth');
    const teamPermissions = localStorage.getItem('team_permissions');

    if (auth !== 'true') {
      router.push('/admin/login');
      return;
    }

    setIsAuthorized(true);

    if (teamPermissions === 'all') {
      setAllowedFeatures('all');
    } else if (teamPermissions) {
      try {
        const parsed = JSON.parse(teamPermissions);
        setAllowedFeatures(Array.isArray(parsed) ? parsed : []);
      } catch(e) {
        if (teamPermissions === 'all') setAllowedFeatures('all');
        else setAllowedFeatures([]);
      }
    } else {
      localStorage.removeItem('admin_auth');
      router.push('/admin/login');
    }

    if ('Notification' in window && window.Notification.permission !== 'granted') {
      setShowNotifyBanner(true);
    }
  }, [router]);

  const handleTabSelect = (id: string) => {
    if (allowedFeatures !== 'all' && Array.isArray(allowedFeatures) && !allowedFeatures.includes(id) && id !== 'dashboard') {
      return;
    }
    startTransition(() => {
      setActiveTab(id);
    });
  };

  const handleSignOut = () => {
    localStorage.removeItem('admin_auth');
    localStorage.removeItem('team_permissions');
    router.push('/');
  };

  const handleEnableNotifications = async () => {
    const token = await requestPushToken();
    if (token) {
      setShowNotifyBanner(false);
    }
  };

  const content = useMemo(() => {
    if (!isAuthorized || allowedFeatures === null) return null;
    
    const isMasterAdmin = allowedFeatures === 'all';
    
    if (!isMasterAdmin && Array.isArray(allowedFeatures) && !allowedFeatures.includes(activeTab) && activeTab !== 'dashboard') {
      return <AdminOverview />;
    }

    switch (activeTab) {
      case 'dashboard': return <AdminOverview />;
      case 'premium_users': return <PremiumUserManagement />;
      case 'global_offer': return <GlobalOfferManagement />;
      case 'receipt_gen': return <ReceiptGenerator />;
      case 'zones': return <ZoneManagement />;
      case 'customers': return <CustomerManagement />;
      case 'stores': return <StoreManagement />;
      case 'medical': return <StoreManagement categoryFilter="Medical" />;
      case 'beauty': return <StoreManagement categoryFilter="Beauty" />;
      case 'fleet': return <FleetManagement />;
      case 'payouts': return <StorePayoutManagement />;
      case 'categories': return <CategoryManagement />;
      case 'products': return <ProductManagement />;
      case 'design': return <BannerManagement />;
      case 'orders': return <OrderManagement />;
      case 'discounts': return <DiscountManagement />;
      case 'charges': return <ChargeManagement />;
      case 'ads': return <MonetizationManagement />;
      case 'tickets': return <TicketManagement />;
      case 'reviews': return <ReviewManagement />;
      case 'pages': return <PageManagement />;
      case 'team': return <TeamManagement />;
      case 'export': return <ExportManagement />;
      case 'settings': return <BrandingManagement />;
      default: return <AdminOverview />;
    }
  }, [activeTab, isAuthorized, allowedFeatures]);

  if (!isAuthorized || allowedFeatures === null) {
    return <div className="h-screen bg-white flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col md:flex-row transform-gpu">
      {/* NOINDEX HEADER FOR SEO PROTECTION */}
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>

      <header className="md:hidden bg-white border-b border-border/50 px-4 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className={cn("p-2 rounded-xl text-white", allowedFeatures === 'all' ? "bg-black" : "bg-primary")}>
            {allowedFeatures === 'all' ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
          </div>
          <h1 className="text-sm font-black italic">SHOPYKART {allowedFeatures === 'all' ? 'CEO' : 'STAFF'}</h1>
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl"><MenuIcon className="h-6 w-6" /></Button></SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-none shadow-2xl">
            <SheetHeader className="sr-only"><SheetTitle>Menu</SheetTitle></SheetHeader>
            <SidebarContent 
              activeTab={activeTab} 
              onTabSelect={handleTabSelect} 
              onSignOut={handleSignOut} 
              onCloseMobile={() => setIsMobileMenuOpen(false)} 
              allowedFeatures={allowedFeatures}
            />
          </SheetContent>
        </Sheet>
      </header>

      <aside className="hidden md:flex w-64 bg-white border-r border-border/50 flex-col sticky top-0 h-screen shadow-sm">
        <SidebarContent 
          activeTab={activeTab} 
          onTabSelect={handleTabSelect} 
          onSignOut={handleSignOut} 
          onCloseMobile={() => {}} 
          allowedFeatures={allowedFeatures}
        />
      </aside>

      <main className={cn("flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full transition-opacity duration-300", isPending ? "opacity-50" : "opacity-100")}>
        {showNotifyBanner && (
          <div className="mb-6 bg-primary/10 border border-primary/20 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
             <div className="flex items-center gap-3">
                <div className="bg-primary p-2 rounded-xl text-white shadow-lg"><BellRing className="h-5 w-5 animate-ring" /></div>
                <div>
                   <h4 className="text-sm font-black italic uppercase">Enable Real-time Cloud Alerts</h4>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Get background bells when new orders arrive</p>
                </div>
             </div>
             <Button onClick={handleEnableNotifications} className="h-10 px-6 rounded-xl bg-primary text-white font-black uppercase italic text-[10px] tracking-widest shadow-xl shadow-primary/20">ALLOW NOTIFICATIONS</Button>
          </div>
        )}

        <header className="mb-6 md:mb-8 animate-in fade-in duration-500">
          <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h2>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">Management Portal</p>
        </header>
        <div className="pb-20 content-visibility-auto">{content}</div>
      </main>
    </div>
  );
}
