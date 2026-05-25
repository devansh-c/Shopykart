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
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
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
      const collections = ['products', 'vendors', 'orders', 'categories', 'coupons'];
      
      for (const colName of collections) {
        const snapshot = await getDocs(collection(firestore, colName));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        zip.file(`${colName}_backup.json`, JSON.stringify(data, null, 2));
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `ShopyKart_Data_Backup_${new Date().toISOString().split('T')[0]}.zip`);
      
      toast({ title: "Backup Successful!", description: "All database collections exported to ZIP." });
    } catch (err) {
      toast({ variant: "destructive", title: "Export Failed" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyCommand = () => {
    const cmd = "zip -r shopykart-project.zip . -x \"node_modules/*\" \".next/*\" \"out/*\" \".git/*\"";
    navigator.clipboard.writeText(cmd);
    setIsCopied(true);
    toast({ title: "Command Copied!" });
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Database Export Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-600">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Database Backup</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Full Firestore Data Export</p>
            </div>
          </div>

          <div className="bg-muted/20 p-5 rounded-3xl border border-dashed space-y-4">
             <div className="flex items-center gap-3">
                <FileJson className="h-5 w-5 text-blue-400" />
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Format: JSON Collections</span>
             </div>
             <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
               Isme aapke saare Products, Vendors, aur Orders ka data shamil hoga. Iska use aap data migration ya recovery ke liye kar sakte hain.
             </p>
          </div>

          <Button 
            onClick={handleExportData} 
            disabled={isExporting}
            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black uppercase italic shadow-xl shadow-blue-100"
          >
            {isExporting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Download className="h-5 w-5 mr-2" />}
            DOWNLOAD DATA ZIP
          </Button>
        </div>

        {/* GitHub Source Prep Card */}
        <div className="bg-[#0B0B0B] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl text-white space-y-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-3 rounded-2xl text-primary border border-primary/20">
              <Github className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">GitHub Ready ZIP</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Source Code Preparation</p>
            </div>
          </div>

          <div className="bg-white/5 p-5 rounded-3xl border border-white/5 space-y-4">
             <div className="flex items-center gap-3">
                <Terminal className="h-5 w-5 text-primary" />
                <span className="text-[11px] font-bold text-gray-400 uppercase">Preparation Guide</span>
             </div>
             <p className="text-[10px] text-gray-500 leading-relaxed font-medium uppercase italic">
               Browser security restrictions ki wajah se poore source folder ka ZIP terminal se banana best hai. optimized command niche di gayi hai:
             </p>
          </div>

          <div className="relative group">
            <div className="bg-black border border-white/10 p-4 rounded-xl font-mono text-[10px] text-green-400 overflow-x-auto whitespace-nowrap scrollbar-none">
              zip -r shopykart.zip . -x "node_modules/*" ".next/*" "out/*"
            </div>
            <button 
              onClick={handleCopyCommand}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all"
            >
              {isCopied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-white" />}
            </button>
          </div>

          <div className="flex items-center gap-3 pt-2">
             <div className="h-8 w-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                <ShieldCheck className="h-5 w-5" />
             </div>
             <span className="text-[9px] font-black uppercase tracking-widest text-green-500">Optimized for Under 25MB</span>
          </div>
        </div>

      </div>

      {/* Instructions & Help */}
      <div className="bg-amber-50 p-8 rounded-[3rem] border-2 border-dashed border-amber-200">
         <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-1" />
            <div className="space-y-4">
               <h4 className="text-sm font-black uppercase text-amber-900">Why Source ZIP is prepared this way?</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] font-bold text-amber-800 leading-relaxed uppercase">
                  <p>
                    1. <span className="font-black text-black">Security:</span> Browsers ko local files edit karne ki permission nahi hoti, isliye code export ke liye Terminal commands ya IDE (VS Code) ka use karein.
                  </p>
                  <p>
                    2. <span className="font-black text-black">Size:</span> node_modules folder (approx 300MB+) ko exclude karna zaroori hai GitHub limit (25MB) ke liye. 
                  </p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}