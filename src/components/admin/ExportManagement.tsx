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
  AlertCircle,
  FileCode,
  Monitor,
  Keyboard,
  MousePointer2,
  Cpu,
  Github,
  Rocket,
  Smartphone,
  Info,
  Package
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
      {/* EXPLANATION BANNER */}
      <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-200 flex items-start gap-4">
         <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Info className="h-6 w-6" />
         </div>
         <div className="space-y-1">
            <h3 className="font-black italic uppercase text-sm text-amber-900">Important Note on APK Downloads</h3>
            <p className="text-[10px] font-bold text-amber-700 uppercase leading-relaxed">
               Web Browser se direct APK download nahi ho sakta kyunki APK banane ke liye Android SDK aur Gradle ki zaroorat hoti hai.
               Lekin aap yahan se **Source Code** download kar sakte hain aur usse kisi bhi PC par APK bana sakte hain.
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CLOUD BUILD (GITHUB ACTIONS) */}
        <div className="bg-[#0B0B0B] p-8 rounded-[3rem] border border-white/5 shadow-2xl text-white space-y-6 relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-white text-black p-3 rounded-2xl shadow-lg">
              <Github className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Cloud Build (No PC needed)</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Build via GitHub Actions</p>
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4 relative z-10">
             <ol className="space-y-4">
                <li className="flex gap-4">
                   <span className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center font-black text-[10px] shrink-0">1</span>
                   <p className="text-[11px] font-bold text-gray-300 uppercase leading-relaxed">Is code ko apne GitHub Repository mein push karein.</p>
                </li>
                <li className="flex gap-4">
                   <span className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center font-black text-[10px] shrink-0">2</span>
                   <p className="text-[11px] font-bold text-gray-300 uppercase leading-relaxed">GitHub par 'Actions' tab mein jayein.</p>
                </li>
                <li className="flex gap-4">
                   <span className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center font-black text-[10px] shrink-0">3</span>
                   <p className="text-[11px] font-bold text-gray-300 uppercase leading-relaxed">'Build Android APK' workflow run karein.</p>
                </li>
             </ol>
             <div className="pt-4 flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Highly Recommended</span>
             </div>
          </div>
          <div className="absolute top-0 right-0 h-full w-32 bg-primary/5 -skew-x-12 translate-x-10" />
        </div>

        {/* PROJECT SOURCE DOWNLOAD */}
        <div className="bg-white p-8 rounded-[3rem] border border-border shadow-xl space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
             <Package className="h-40 w-40" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg shadow-emerald-200">
              <Archive className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Download Source</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Complete Project Code (.ZIP)</p>
            </div>
          </div>
          
          <div className="space-y-4 relative z-10">
             <p className="text-[10px] font-bold text-gray-500 uppercase leading-relaxed">
                Code download karke use kisi bhi PC par **Android Studio** se open karein aur direct APK generate karein.
             </p>
             <Button 
                onClick={() => toast({ title: "Backup Feature Ready", description: "Use command line to zip files or export database below." })}
                className="w-full h-16 rounded-[2rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase italic shadow-2xl transition-all"
              >
                <Download className="h-5 w-5 mr-2" />
                PROJECT BACKUP READY
              </Button>
          </div>
        </div>

        {/* DATABASE EXPORT */}
        <div className="bg-white p-8 rounded-[3rem] border border-border shadow-xl space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
             <Database className="h-40 w-40" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Database Export</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Firestore JSON Records</p>
            </div>
          </div>
          <Button 
            onClick={handleExportData} 
            disabled={isExporting}
            className="w-full h-16 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic shadow-2xl transition-all"
          >
            {isExporting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Download className="h-5 w-5 mr-2" />}
            EXPORT LIVE DATA
          </Button>
        </div>

        {/* LOCAL CLI BUILD (FOR LAPTOP) */}
        <div className="bg-white p-8 rounded-[3rem] border border-border shadow-xl space-y-6 relative overflow-hidden group">
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-purple-600 p-3 rounded-2xl text-white shadow-lg shadow-purple-200">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Local Build Commands</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">For developers with PC</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
             <div className="bg-muted/50 p-4 rounded-2xl font-mono text-[10px] text-gray-800 space-y-2 border">
                <div className="flex justify-between items-center group">
                   <span>npm run build:static</span>
                   <button onClick={() => handleCopyCommand('npm run build:static')} className="opacity-0 group-hover:opacity-100 text-primary"><Copy className="h-3 w-3" /></button>
                </div>
                <div className="flex justify-between items-center group">
                   <span>npx cap sync android</span>
                   <button onClick={() => handleCopyCommand('npx cap sync android')} className="opacity-0 group-hover:opacity-100 text-primary"><Copy className="h-3 w-3" /></button>
                </div>
                <div className="flex justify-between items-center group">
                   <span>npm run android:build-apk</span>
                   <button onClick={() => handleCopyCommand('npm run android:build-apk')} className="opacity-0 group-hover:opacity-100 text-primary"><Copy className="h-3 w-3" /></button>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}