
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
  Users,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

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

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'stores', label: 'Stores', icon: Store },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'catalog', label: 'Catalog', icon: Layers },
  { id: 'design', label: 'Banners', icon: Feather },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'discounts', label: 'Discounts', icon: Percent },
  { id: 'charges', label: 'Tax & Charges', icon: Receipt },
  { id: 'notifications', label: 'Notifications', icon: BellRing },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminOverview />;
      case 'customers':
        return <CustomerManagement />;
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
      case 'discounts':
        return <DiscountManagement />;
      case 'charges':
        return <ChargeManagement />;
      case 'notifications':
        return <NotificationManagement />;
      case 'reviews':
        return <ReviewManagement />;
      case 'settings':
        return <BrandingManagement />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col md:flex-row">
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
