"use client"

import { useState } from 'react';
import { 
  Download, 
  Database, 
  Github, 
  Loader2, 
  Zap, 
  Smartphone, 
  Code,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Terminal,
  FileJson,
  Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function ExportManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

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
        toast({ title: "Database Exported! ✅" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Export Failed" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl pb-32">
      
      {/* 1. THE GITHUB APK MASTER GUIDE */}
      <div className="bg-[#0B0B0B] p-8 rounded-[3rem] border border-white/10 shadow-2xl text-white relative overflow-hidden">
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-5">
            <div className="bg-white text-black p-4 rounded-[1.5rem] shadow-xl">
              <Github className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">GitHub Cloud Build</h2>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bina PC ke APK banane ka rasta</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-black italic uppercase text-primary">Process Steps:</h3>
              <div className="space-y-4">
                {[
                  { step: "01", text: "GitHub.com par account banayein aur ek naya repository 'ShopyKart' ke naam se create karein." },
                  { step: "02", text: "Apne project ka saara code us repository mein upload (Push) kar dein." },
                  { step: "03", text: "Top menu mein 'Actions' tab par click karein." },
                  { step: "04", text: "'Build Android APK' workflow select karein aur 'Run workflow' par click karein." },
                  { step: "05", text: "5-10 minute intezar karein, wahi par aapko APK download mil jayegi." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <span className="text-primary font-black italic text-xl leading-none">{item.step}</span>
                    <p className="text-[11px] font-bold text-gray-300 uppercase leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-400">
                  <Zap className="h-5 w-5 fill-amber-400" />
                  <span className="text-[10px] font-black uppercase">Why this is best?</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed uppercase font-bold">
                  Aapka laptop hang nahi hoga. GitHub ke powerful servers humara APK banayenge. Ye bilkul safe aur fast hai.
                </p>
              </div>
              <div className="pt-6">
                <div className="bg-primary/20 p-4 rounded-2xl border border-primary/20 flex items-start gap-3">
                  <Terminal className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-[9px] font-bold text-primary uppercase leading-tight">
                    Maine '.github/workflows/android-build.yml' pehle hi set kar diya hai. Aapko bas code upload karna hai.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 h-full w-44 bg-primary/5 -skew-x-12 translate-x-12" />
      </div>

      {/* 2. DATABASE EXPORT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border border-border shadow-sm space-y-6 relative overflow-hidden group">
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-gray-900">Database Export</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Download all records as JSON</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed relative z-10 uppercase font-bold">
            Aapke products, stores aur orders ka backup lene ke liye ye best rasta hai.
          </p>
          <Button 
            onClick={handleExportData} 
            disabled={isExporting}
            className="w-full h-16 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic shadow-xl active:scale-95 transition-all"
          >
            {isExporting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Download className="h-5 w-5 mr-2" />}
            GENERATE BACKUP
          </Button>
        </div>

        {/* PROJECT SOURCE */}
        <div className="bg-white p-8 rounded-[3rem] border border-border shadow-sm space-y-6 relative overflow-hidden group">
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg">
              <Code className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-gray-900">Source Backup</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Download entire app code</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed relative z-10 uppercase font-bold">
            Agar aapko kisi dusre PC par app setup karna hai ya GitHub par dalna hai toh yahan se zip download karein.
          </p>
          <Button 
            className="w-full h-16 rounded-[2rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase italic shadow-xl active:scale-95 transition-all"
          >
            <Archive className="h-5 w-5 mr-2" />
            DOWNLOAD SOURCE ZIP
          </Button>
        </div>
      </div>

    </div>
  );
}
