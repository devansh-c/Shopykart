"use client"

import { useState } from 'react';
import { 
  Download, 
  Database, 
  Archive, 
  Loader2, 
  Copy,
  Check,
  Zap,
  Smartphone,
  Info,
  Package,
  Github,
  Globe,
  PlusCircle,
  SmartphoneNfc
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function ExportManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleExportData = async () => {
    if (!firestore) return;
    setIsExporting(true);
    
    try {
      const JSZip = (await import('jszip')).default;
      const FileSaver = await import('file-saver');
      const saveAs = FileSaver.saveAs || (FileSaver as any).default;

      const zip = new JSZip();
      const collections = ['products', 'vendors', 'orders', 'categories', 'coupons', 'users', 'tickets', 'pages'];
      
      for (const colName of collections) {
        try {
          const snapshot = await getDocs(collection(firestore, colName));
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          zip.file(`${colName}_backup.json`, JSON.stringify(data, null, 2));
        } catch (e) {
          console.warn(`Could not export ${colName}:`, e);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      if (typeof saveAs === 'function') {
        saveAs(content, `ShopyKart_Data_Backup_${new Date().toISOString().split('T')[0]}.zip`);
        toast({ title: "Data Exported! ✅" });
      } else {
        throw new Error("File saver failed to load");
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Export Failed" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl pb-32">
      {/* THE EASY WAY (PWA) */}
      <div className="bg-gradient-to-br from-primary to-accent p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <div className="bg-white/20 w-16 h-16 rounded-[1.5rem] flex items-center justify-center backdrop-blur-md mx-auto md:mx-0">
              <SmartphoneNfc className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter">Sabse Easy Way (Install App)</h3>
              <p className="text-sm font-bold opacity-80 uppercase tracking-widest mt-1">Bina APK download kiye app chalayein</p>
            </div>
            <div className="bg-black/20 p-6 rounded-3xl border border-white/10 space-y-3">
              <p className="text-xs font-bold leading-relaxed uppercase">
                1. Apne phone ke Chrome browser mein <span className="text-white font-black underline">shopykart.co.in</span> kholein.<br/>
                2. Side mein bane <span className="font-black">3-Dots (Menu)</span> par click karein.<br/>
                3. <span className="bg-white text-primary px-2 py-0.5 rounded font-black italic">"INSTALL APP"</span> select karein.
              </p>
              <div className="flex items-center gap-2 text-[10px] font-black text-amber-300">
                <Zap className="h-3 w-3 fill-amber-300" /> YE APK SE BHI FAST AUR SMOOTH HAI!
              </div>
            </div>
          </div>
          <div className="relative shrink-0">
             <div className="w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse absolute inset-0" />
             <PlusCircle className="h-32 w-32 text-white/20 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
          </div>
        </div>
        <div className="absolute top-0 right-0 h-full w-44 bg-white/5 -skew-x-12 translate-x-20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CLOUD APK BUILD */}
        <div className="bg-[#0B0B0B] p-8 rounded-[3rem] border border-white/5 shadow-2xl text-white space-y-6 relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-white text-black p-3 rounded-2xl shadow-lg">
              <Github className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Pro Way: Cloud APK Build</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Generate .APK file via GitHub</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed relative z-10 uppercase font-bold">
            Agar aapko file share karni hai, toh code GitHub par push karein. GitHub apne aap APK banakar aapko link bhej dega.
          </p>
          <div className="absolute top-0 right-0 h-full w-32 bg-primary/5 -skew-x-12 translate-x-10" />
        </div>

        {/* DATABASE EXPORT */}
        <div className="bg-white p-8 rounded-[3rem] border border-border shadow-xl space-y-6 relative overflow-hidden group">
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Database Export</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">JSON Records Backup</p>
            </div>
          </div>
          <Button 
            onClick={handleExportData} 
            disabled={isExporting}
            className="w-full h-16 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic shadow-xl active:scale-95 transition-all"
          >
            {isExporting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Download className="h-5 w-5 mr-2" />}
            DOWNLOAD DATA ZIP
          </Button>
        </div>
      </div>
    </div>
  );
}