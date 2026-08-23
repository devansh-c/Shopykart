"use client"

import { useState, useEffect } from 'react';
import { Megaphone, Save, Loader2, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * @fileOverview Announcement Management for CEO/Staff.
 */
export default function AnnouncementManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const announcementRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'announcement');
  }, [firestore]);

  const { data: announcement, loading } = useDoc<any>(announcementRef);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    isActive: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title || '',
        message: announcement.message || '',
        type: announcement.type || 'info',
        isActive: announcement.isActive || false,
      });
    }
  }, [announcement]);

  const handleSave = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, 'app_settings', 'announcement'), {
        ...formData,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast({ title: "Announcement Updated!", description: "Changes are now live for all customers." });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
              <Megaphone className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-gray-900">Broadcast Alert</h3>
          </div>
          <div className="flex items-center gap-3 bg-muted/30 px-4 py-2 rounded-2xl">
             <span className="text-[10px] font-black uppercase text-muted-foreground">{formData.isActive ? 'ACTIVE' : 'OFFLINE'}</span>
             <Switch 
               checked={formData.isActive}
               onCheckedChange={(val) => setFormData({...formData, isActive: val})}
               className="data-[state=checked]:bg-green-500"
             />
          </div>
        </div>

        <div className="space-y-4">
           <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Headline (Optional)</label>
              <Input 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Holi Special Offer! 🎨"
                className="h-12 rounded-xl font-bold bg-muted/20 border-none"
              />
           </div>

           <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Live Message *</label>
              <Textarea 
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                placeholder="Write what customers should see..."
                className="min-h-[120px] rounded-2xl bg-muted/20 border-none font-medium text-sm p-4"
              />
           </div>

           <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Visual Style</label>
              <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})}>
                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold">
                  <SelectValue placeholder="Select Style" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                   <SelectItem value="info" className="font-bold py-3 uppercase text-xs italic">Blue - Informational</SelectItem>
                   <SelectItem value="warning" className="font-bold py-3 uppercase text-xs italic">Amber - Important</SelectItem>
                   <SelectItem value="success" className="font-bold py-3 uppercase text-xs italic">Green - Promotional</SelectItem>
                   <SelectItem value="error" className="font-bold py-3 uppercase text-xs italic">Red - Critical Alert</SelectItem>
                </SelectContent>
              </Select>
           </div>
        </div>

        <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex items-start gap-4">
           <div className="bg-blue-600 p-2 rounded-lg text-white"><Megaphone className="h-4 w-4" /></div>
           <p className="text-[10px] font-bold text-blue-800 uppercase leading-relaxed">
             Ye message ShopyKart kholte hi sabhi customers ko top par dikhega. Ismein "X" button nahi hoga, toh ye tab tak dikhega jab tak aap yahan se band nahi karte.
           </p>
        </div>

        <Button 
          onClick={handleSave}
          disabled={isSaving || !formData.message}
          className="w-full h-18 bg-[#0B0B0B] hover:bg-primary text-white rounded-[2rem] font-black uppercase italic text-lg shadow-xl transition-all"
        >
          {isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Save className="h-5 w-5 mr-3" />}
          PUBLISH ANNOUNCEMENT
        </Button>
      </div>
    </div>
  );
}
