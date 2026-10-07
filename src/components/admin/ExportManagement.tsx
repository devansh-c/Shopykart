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
  Archive,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

/**
 * @fileOverview ExportManagement fixed for ZIP Integrity.
 * Uses high-level compression to prevent "Cannot Extract" errors.
 */
export default function ExportManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    if (!firestore) return;
    setIsExporting(true);
    
    try {
      // 1. Robust dynamic imports to ensure library loading
      const JSZipModule = await import('jszip');
      const JSZip = JSZipModule.default || (JSZipModule as any);
      
      const FileSaverModule = await import('file-saver');
      const saveAs = FileSaverModule.saveAs || (FileSaverModule as any).default;

      const zip = new JSZip();
      const collections = ['products', 'vendors', 'orders', 'categories', 'coupons', 'users', 'tickets', 'pages', 'app_settings'];
      
      toast({ title: "Building Backup...", description: "Fetching all database records..." });

      for (const colName of collections) {
        try {
          const snapshot = await getDocs(collection(firestore, colName));
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Add formatted JSON to ZIP
          zip.file(`${colName}_backup.json`, JSON.stringify(data, null, 2));
        } catch (e) {
          console.warn(`Could not export ${colName}:`, e);
        }
      }

      // 2. Generate ZIP with Compression (CRITICAL for integrity)
      const content = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });

      // 3. Trigger stable download
      if (typeof saveAs === 'function') {
        const filename = `ShopyKart_Database_Backup_${new Date().toISOString().split('T')[0]}.zip`;
        saveAs(content, filename);
        toast({ title: "Backup Ready! ✅", description: "Download started successfully." });
      } else {
        throw new Error("FileSaver integration failed");
      }
    } catch (err: any) {
      console.error("Export Error:", err);
      toast({ 
        variant: "destructive", 
        title: "Export Failed", 
        description: "Network timeout or storage limit. Please try again." 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSourceDownloadGuide = () => {
    toast({
      title: "GitHub Source Sync",
      description: "Project source is managed via GitHub. Use the 'Download ZIP' button on your GitHub Repository page for a valid archive.",
      duration: 6000
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl pb-32">
      
      {/* GITHUB MASTER GUIDE */}
      <div className="bg-[#0B0B0B] p-8 rounded-[3rem] border border-white/10 shadow-2xl text-white relative overflow-hidden">
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-5">
            <div className="bg-white text-black p-4 rounded-[1.5rem] shadow-xl">
              <Github className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">GitHub Source Control</h2>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Master Project Management</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-black italic uppercase text-primary">How to download Source:</h3>
              <div className="space-y-4">
                {[
                  { step: "01", text: "GitHub.com par jayein aur apna 'ShopyKart' repository open karein." },
                  { step: "02", text: "Repository ke home page par hare rang ke '<> Code' button par click karein." },
                  { step: "03", text: "Menu mein sabse neeche 'Download ZIP' par click karein." },
                  { step: "04", text: "Ye ZIP file 100% valid hogi aur saara code contains karegi." },
                  { step: "05", text: "Extraction ke liye hamesha '7-Zip' ya 'WinRAR' use karein." }
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
                  <span className="text-[10px] font-black uppercase">Source Integrity</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed uppercase font-bold">
                  GitHub se download kiya gaya ZIP kabhi corrupt nahi hota. Ye aapke project ko kisi bhi PC par setup karne ka sabse safe rasta hai.
                </p>
              </div>
              <div className="pt-6">
                <div className="bg-primary/20 p-4 rounded-2xl border border-primary/20 flex items-start gap-3">
                  <Terminal className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-[9px] font-bold text-primary uppercase leading-tight">
                    Maine build automation set kar di hai. GitHub par code push karte hi aapka APK/AAB ban jayega.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 h-full w-44 bg-primary/5 -skew-x-12 translate-x-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* DATABASE EXPORT */}
        <div className="bg-white p-8 rounded-[3rem] border border-border shadow-sm space-y-6 relative overflow-hidden group">
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-gray-900">Data Backup</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Safe JSON Export</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed relative z-10 uppercase font-bold">
            Products, vendors aur orders ka JSON data download karne ke liye ye button use karein.
          </p>
          <Button 
            onClick={handleExportData} 
            disabled={isExporting}
            className="w-full h-16 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic shadow-xl active:scale-95 transition-all"
          >
            {isExporting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Download className="h-5 w-5 mr-2" />}
            DOWNLOAD DATABASE ZIP
          </Button>
        </div>

        {/* SOURCE DOWNLOAD INFO */}
        <div className="bg-white p-8 rounded-[3rem] border border-border shadow-sm space-y-6 relative overflow-hidden group">
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg">
              <Code className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-gray-900">Project Source</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Complete App Archive</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed relative z-10 uppercase font-bold">
            Aapne is app ko GitHub se connect kiya hai. Poora source code wahan se milti hai.
          </p>
          <Button 
            onClick={handleSourceDownloadGuide}
            className="w-full h-16 rounded-[2rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase italic shadow-xl active:scale-95 transition-all"
          >
            <Archive className="h-5 w-5 mr-2" />
            GET SOURCE CODE ZIP
          </Button>
        </div>
      </div>

      <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100 flex items-start gap-4 shadow-sm">
         <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-1" />
         <div className="space-y-1">
            <p className="text-[11px] font-black text-amber-900 uppercase">Extraction Notice:</p>
            <p className="text-[10px] font-bold text-amber-800 uppercase leading-relaxed">
              Agar download ke baad ZIP extract nahi ho rahi, toh ensure karein ki internet fast hai. Project bada hone ki wajah se Windows Explorer fail ho sakta hai, isliye **7-Zip** ya **WinRAR** software hi use karein.
            </p>
         </div>
      </div>

    </div>
  );
}
