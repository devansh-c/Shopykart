
"use client"

import { useState } from 'react';
import { Plus, Trash2, Tag, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const initialBanners = [
  { id: 'b1', title: 'BUY 1 GET 1', subtitle: 'BARBEQUE BURGER', tag: 'App Only Offer' },
  { id: 'b2', title: '50% OFF', subtitle: 'FIRST ORDER', tag: 'Limited Time' },
];

export function BannerManagement() {
  const [banners, setBanners] = useState(initialBanners);
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    setBanners(banners.filter(b => b.id !== id));
    toast({ title: "Banner Removed", description: "The banner slider has been updated." });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button className="bg-primary hover:bg-primary/90 rounded-xl">
          <Plus className="h-4 w-4 mr-2" />
          Create Banner
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white rounded-2xl border p-1 overflow-hidden group">
            <div className="relative h-40 bg-muted rounded-xl flex items-center justify-center m-1">
              <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 flex flex-col justify-end p-4 rounded-xl">
                <h3 className="text-white font-black text-xl italic">{banner.title}</h3>
                <p className="text-primary text-xs font-bold">{banner.subtitle}</p>
              </div>
              <button 
                onClick={() => handleDelete(banner.id)}
                className="absolute top-3 right-3 bg-white/10 backdrop-blur-md p-2 rounded-xl text-white hover:bg-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 pt-2">
              <div className="flex items-center text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                <Tag className="h-3 w-3 mr-1" />
                {banner.tag}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
