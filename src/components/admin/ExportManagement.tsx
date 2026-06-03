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
  Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

export function ExportManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleExportData = async () => {
    if (!firestore) return;
    setIsExporting(true);
    
    try {
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
      {/* Visual Guide Header */}
      <div className="bg-white p-6 rounded-[2rem] border border-primary/20 shadow-sm flex items-center gap-4">
         <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Zap className="h-6 w-6" />
         </div>
         <div>
            <h3 className="font-black italic uppercase text-sm">Deployment & Export Hub</h3>
            <p className="text-[10px] font-bold text-gray-500 uppercase leading-relaxed">
               Manage your source code, database backups, and mobile app builds.
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* 1. Database ZIP Export */}
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
               This will bundle all your Products, Vendors, Orders, and Users into a single ZIP file.
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

        {/* 2. Project Source ZIP */}
        <div className="bg-[#0B0B0B] p-8 rounded-[3rem] border border-white/5 shadow-2xl text-white space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
             <Github className="h-40 w-40" />
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-primary p-3 rounded-2xl text-white shadow-lg shadow-primary/20">
              <FileCode className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Source Code ZIP</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">GitHub Ready Package</p>
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4 relative z-10">
             <p className="text-[10px] text-gray-400 leading-relaxed font-bold uppercase italic">
               Terminal mein niche di gayi command chalaein. Phir Sidebar mein <span className="text-white">shopykart-project.zip</span> par Right-Click karke Download karein.
             </p>
          </div>

          <div className="relative group/cmd z-10">
            <div className="bg-black border border-white/10 p-5 rounded-2xl font-mono text-xs text-green-400 overflow-x-auto whitespace-nowrap no-scrollbar pr-12">
              npm run zip-project
            </div>
            <button 
              onClick={() => handleCopyCommand('npm run zip-project')}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all active:scale-90"
            >
              {isCopied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-white" />}
            </button>
          </div>
        </div>

        {/* 3. Android App Build */}
        <div className="bg-white p-8 rounded-[3rem] border border-border shadow-xl space-y-6 relative overflow-hidden group md:col-span-2">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
             <Smartphone className="h-40 w-40" />
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-green-600 p-3 rounded-2xl text-white shadow-lg shadow-green-200">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Android App (APK)</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Capacitor Native Build</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
             <div className="space-y-4">
                <p className="text-[11px] font-bold text-gray-600 uppercase leading-relaxed">
                   ShopyKart ko native Android app banane ke liye niche di gayi steps follow karein:
                </p>
                <ul className="space-y-3">
                   {[
                     { step: '1', text: 'Run: npm run static-build (Build Web)', cmd: 'npm run static-build' },
                     { step: '2', text: 'Run: npx cap sync (Sync to Android)', cmd: 'npx cap sync' },
                     { step: '3', text: 'Run: npx cap open android', cmd: 'npx cap open android' },
                   ].map((item) => (
                     <li key={item.step} className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/50">
                        <div className="flex items-center gap-3">
                           <span className="h-6 w-6 rounded-full bg-black text-white flex items-center justify-center font-black text-[10px]">{item.step}</span>
                           <span className="text-[10px] font-black uppercase tracking-tight">{item.text}</span>
                        </div>
                        <button onClick={() => handleCopyCommand(item.cmd)} className="text-primary hover:bg-primary/10 p-1.5 rounded-lg"><Copy className="h-3.5 w-3.5" /></button>
                     </li>
                   ))}
                </ul>
             </div>

             <div className="bg-green-50 p-6 rounded-[2rem] border border-green-100 flex flex-col justify-center items-center text-center space-y-4">
                <Smartphone className="h-12 w-12 text-green-600 animate-bounce" />
                <h4 className="font-black italic uppercase text-green-800">Ready for Play Store</h4>
                <p className="text-[10px] font-bold text-green-700/70 uppercase leading-relaxed">
                   Open karne ke baad Android Studio mein "Build &gt; Build Bundle(s) / APK(s) &gt; Build APK" select karein.
                </p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}