
"use client"

import { useState } from 'react';
import { 
  Download, 
  Database, 
  Github, 
  FileJson, 
  Archive, 
  ShieldCheck, 
  Loader2, 
  Terminal, 
  AlertCircle,
  Copy,
  Check,
  Zap,
  Info,
  FileCode,
  ArrowRight,
  Smartphone,
  Cpu,
  Monitor,
  MousePointer2,
  ListRestart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';

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
      const { saveAs } = await import('file-saver');

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

      zip.file("README.txt", "ShopyKart Database Backup\nGenerated on: " + new Date().toLocaleString());

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `ShopyKart_Data_Backup_${new Date().toISOString().split('T')[0]}.zip`);
      
      toast({ title: "Backup Successful!", description: "All database collections exported to ZIP." });
    } catch (err) {
      toast({ variant: "destructive", title: "Export Failed" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyCommand = (cmd: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(cmd);
      setIsCopied(true);
      toast({ title: "Command Copied!" });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl pb-32">
      <div className="bg-white p-6 rounded-[2rem] border border-primary/20 shadow-sm flex items-center gap-4">
         <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Zap className="h-6 w-6" />
         </div>
         <div>
            <h3 className="font-black italic uppercase text-sm">Deployment Hub</h3>
            <p className="text-[10px] font-bold text-gray-500 uppercase leading-relaxed">
               Manage your source code, database backups, and mobile app builds.
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* DATABASE EXPORT */}
        <div className="bg-white p-8 rounded-[3rem] border border-border shadow-xl space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
             <Database className="h-40 w-40" />
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
              <Archive className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Master Data ZIP</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Instant Firestore Backup</p>
            </div>
          </div>

          <div className="bg-blue-50/50 p-6 rounded-3xl border-2 border-dashed border-blue-100 space-y-4 relative z-10">
             <div className="flex items-center gap-3">
                <FileJson className="h-5 w-5 text-blue-500" />
                <span className="text-[11px] font-black text-blue-700 uppercase leading-none">JSON Collections Backup</span>
             </div>
             <p className="text-[10px] text-blue-600/80 leading-relaxed font-bold uppercase italic">
               Ye button aapke saare products, orders aur vendors ko ek JSON ZIP mein download kar lega.
             </p>
          </div>

          <Button 
            onClick={handleExportData} 
            disabled={isExporting}
            className="w-full h-16 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic shadow-2xl transition-all active:scale-95"
          >
            {isExporting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Download className="h-5 w-5 mr-2" />}
            DOWNLOAD DATABASE ZIP
          </Button>
        </div>

        {/* SOURCE CODE EXPORT (KEYBOARD FRIENDLY) */}
        <div className="bg-[#0B0B0B] p-8 rounded-[3rem] border border-white/5 shadow-2xl text-white space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
             <FileCode className="h-40 w-40 text-white" />
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-primary p-3 rounded-2xl text-white shadow-lg shadow-primary/20">
              <FileCode className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Source Code ZIP</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Download for Android Studio</p>
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-6 relative z-10">
             <div className="space-y-4">
                <h4 className="text-sm font-black text-primary italic uppercase underline underline-offset-4">DOWNLOAD STEPS</h4>
                
                <div className="space-y-5">
                   <div className="flex items-start gap-4">
                      <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">1</div>
                      <p className="text-[11px] font-bold text-gray-300 uppercase leading-relaxed">
                        Copy & Run this command in **Terminal**:
                      </p>
                   </div>

                   <div className="relative group/cmd ml-10">
                      <div className="bg-black border border-white/20 p-4 rounded-xl font-mono text-xs text-green-400 overflow-x-auto">
                        npm run zip-project
                      </div>
                      <button 
                        onClick={() => handleCopyCommand('npm run zip-project')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all"
                      >
                        {isCopied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3 text-white" />}
                      </button>
                   </div>

                   <div className="flex items-start gap-4">
                      <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">2</div>
                      <p className="text-[11px] font-bold text-gray-300 uppercase leading-relaxed">
                        Wait for "Success" message in terminal, then click:
                      </p>
                   </div>

                   <a 
                     href="/shopykart-source.zip" 
                     download="shopykart-source.zip"
                     className="w-full h-16 bg-white hover:bg-gray-100 text-black rounded-2xl font-black uppercase italic flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95"
                   >
                     <Download className="h-6 w-6 text-primary" />
                     CLICK TO DOWNLOAD ZIP
                   </a>
                </div>
             </div>
          </div>

          <div className="bg-amber-400/10 p-4 rounded-2xl border border-amber-400/20 mt-4">
             <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[9px] font-bold text-amber-100 uppercase leading-relaxed">
                   IMPORTANT: Agar command nahi chalayi toh download button kaam nahi karega.
                </p>
             </div>
          </div>
        </div>

        {/* NATIVE PC BUILD GUIDE */}
        <div className="bg-white p-8 rounded-[3rem] border border-border shadow-xl space-y-6 relative overflow-hidden group lg:col-span-2">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
             <Monitor className="h-40 w-40" />
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-green-600 p-3 rounded-2xl text-white shadow-lg shadow-green-200">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Build Your APK (Native PC)</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Standard Android Build Guide</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
             <div className="space-y-4">
                <p className="text-[11px] font-bold text-gray-600 uppercase leading-relaxed">
                   APK build karne ke liye aapko code PC par le jana hoga:
                </p>
                <ul className="space-y-3">
                   <li className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/50">
                      <div className="flex items-center gap-3">
                         <span className="h-6 w-6 rounded-full bg-black text-white flex items-center justify-center font-black text-[10px]">1</span>
                         <span className="text-[10px] font-black uppercase">Run command & download source zip</span>
                      </div>
                   </li>
                   <li className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/50">
                      <div className="flex items-center gap-3">
                         <span className="h-6 w-6 rounded-full bg-black text-white flex items-center justify-center font-black text-[10px]">2</span>
                         <span className="text-[10px] font-black uppercase">PC pe Extract karke 'npm install' karein</span>
                      </div>
                   </li>
                   <li className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/50">
                      <div className="flex items-center gap-3">
                         <span className="h-6 w-6 rounded-full bg-black text-white flex items-center justify-center font-black text-[10px]">3</span>
                         <span className="text-[10px] font-black uppercase">Open folder in Android Studio</span>
                      </div>
                   </li>
                   <li className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/50">
                      <div className="flex items-center gap-3">
                         <span className="h-6 w-6 rounded-full bg-black text-white flex items-center justify-center font-black text-[10px]">4</span>
                         <span className="text-[10px] font-black uppercase">Click: Build &gt; Build APK</span>
                      </div>
                   </li>
                </ul>
             </div>

             <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex flex-col justify-center items-center text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-amber-600 animate-pulse" />
                <h4 className="font-black italic uppercase text-amber-800 text-lg">Hardware Note</h4>
                <p className="text-[10px] font-bold text-amber-700/70 uppercase leading-relaxed max-w-[220px]">
                   APK build process (Gradle) bahut heavy hota hai aur sirf Windows/Mac/Linux PC par hi chalta hai. Mobile par sirf code bundle ho sakta hai.
                </p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
