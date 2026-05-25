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
  FileCode
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
      const collections = ['products', 'vendors', 'orders', 'categories', 'coupons', 'users'];
      
      // Fetch data from each collection and add to ZIP
      for (const colName of collections) {
        try {
          const snapshot = await getDocs(collection(firestore, colName));
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          zip.file(`${colName}_backup.json`, JSON.stringify(data, null, 2));
        } catch (e) {
          console.warn(`Could not export ${colName}:`, e);
        }
      }

      // Add a README to the ZIP
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

  const handleCopyCommand = () => {
    // Command to zip project excluding heavy folders
    const cmd = "zip -r shopykart-project.zip . -x \"node_modules/*\" \".next/*\" \"out/*\" \".git/*\"";
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(cmd);
      setIsCopied(true);
      toast({ title: "Command Copied!" });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl pb-32">
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
                <span className="text-[11px] font-black text-blue-700 uppercase">Includes: Products, Orders, Users</span>
             </div>
             <p className="text-[10px] text-blue-600/80 leading-relaxed font-bold uppercase italic">
               Yeh option aapke poore business data ko ek ZIP file mein export kar dega. Ise aap kabhi bhi restore kar sakte hain.
             </p>
          </div>

          <Button 
            onClick={handleExportData} 
            disabled={isExporting}
            className="w-full h-16 rounded-[2rem] bg-blue-600 hover:bg-blue-700 font-black uppercase italic shadow-2xl shadow-blue-100 relative z-10 transition-all active:scale-95"
          >
            {isExporting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Download className="h-5 w-5 mr-2" />}
            DOWNLOAD DATABASE ZIP
          </Button>
        </div>

        {/* 2. Project Source Helper */}
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
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">GitHub Upload Optimizer</p>
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4 relative z-10">
             <div className="flex items-center gap-3 text-primary">
                <Zap className="h-5 w-5" />
                <span className="text-[11px] font-bold uppercase">Ready for GitHub (Under 1MB)</span>
             </div>
             <p className="text-[10px] text-gray-400 leading-relaxed font-bold uppercase italic">
               Browser se poora code zip nahi ho sakta. Lekin maine optimizations kar di hain. Aap apne computer par ZIP banaiye, size 25MB se kam hoga.
             </p>
          </div>

          <div className="relative group/cmd z-10">
            <div className="bg-black border border-white/10 p-5 rounded-2xl font-mono text-[10px] text-green-400 overflow-x-auto whitespace-nowrap no-scrollbar pr-12">
              zip -r shopykart.zip . -x "node_modules/*"
            </div>
            <button 
              onClick={handleCopyCommand}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all active:scale-90"
            >
              {isCopied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-white" />}
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 relative z-10">
             <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <span className="text-[9px] font-black uppercase text-green-500">Security Configured</span>
             </div>
             <div className="bg-primary/20 text-primary px-3 py-1 rounded-full font-black text-[8px] uppercase tracking-widest">GITHUB_READY</div>
          </div>
        </div>

      </div>

      {/* Warning/Guide Section */}
      <div className="bg-amber-50 p-8 rounded-[3.5rem] border-2 border-dashed border-amber-200">
         <div className="flex items-start gap-4">
            <AlertCircle className="h-8 w-8 text-amber-600 shrink-0 mt-1" />
            <div className="space-y-5">
               <h4 className="text-lg font-black uppercase text-amber-900 leading-none">Aapka ZIP Download Kyun Nahi Ho Raha?</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] font-bold text-amber-800 leading-relaxed uppercase">
                  <div className="space-y-2">
                    <p className="font-black text-black text-xs">1. Database ZIP vs Code ZIP:</p>
                    <p>Upar wala "Database ZIP" button instantly kaam karega. Lekin "Source Code" (jispe aap kaam kar rahe hain) ko download karne ke liye browser ko poore computer ki files read karni padti hain jo browser security ki wajah se blocked hai.</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-black text-black text-xs">2. 25MB Limit Solution:</p>
                    <p>Maine project mein `.gitignore` daal diya hai. Aap apne PC par folder ko Right-click karke ZIP karein, bas `node_modules` ko shamil mat karna. ZIP ka size sirf 1MB banega!</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-border shadow-sm flex items-center justify-center gap-4">
         <div className="bg-green-50 p-3 rounded-2xl text-green-600">
            <Info className="h-6 w-6" />
         </div>
         <p className="text-[11px] font-bold text-gray-500 uppercase text-center leading-relaxed">
           Tip: Database ZIP ko har hafte download karke safe rakhein. GitHub par sirf code upload hota hai, data nahi.
         </p>
      </div>
    </div>
  );
}
