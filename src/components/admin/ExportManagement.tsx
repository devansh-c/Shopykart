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
  Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

/**
 * @fileOverview Deployment Hub with Keyboard Workflow instructions.
 * Optimized for users on Laptops without a mouse.
 */
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
      // Handle potential default export or named export
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
      <div className="bg-white p-6 rounded-[2rem] border border-primary/20 shadow-sm flex items-center gap-4">
         <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Zap className="h-6 w-6" />
         </div>
         <div>
            <h3 className="font-black italic uppercase text-sm">Deployment Hub</h3>
            <p className="text-[10px] font-bold text-gray-500 uppercase leading-relaxed">
               Package your source code for Android Studio to generate the APK.
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
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Master Data</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Firestore JSON Backup</p>
            </div>
          </div>
          <Button 
            onClick={handleExportData} 
            disabled={isExporting}
            className="w-full h-16 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic shadow-2xl transition-all"
          >
            {isExporting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Download className="h-5 w-5 mr-2" />}
            DOWNLOAD DATABASE ZIP
          </Button>
        </div>

        {/* KEYBOARD FLOW FOR SOURCE CODE */}
        <div className="bg-[#0B0B0B] p-8 rounded-[3rem] border border-white/5 shadow-2xl text-white space-y-6 relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-primary p-3 rounded-2xl text-white shadow-lg shadow-primary/20">
              <Keyboard className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Keyboard-Only Workflow</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No Mouse Required to Package Code</p>
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-5 relative z-10">
             <div className="space-y-4">
                <div className="flex items-start gap-4">
                   <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">1</div>
                   <div className="flex-1">
                      <p className="text-[11px] font-bold text-gray-300 uppercase leading-relaxed mb-2">Run this in Terminal below:</p>
                      <div className="relative group">
                        <div className="bg-black border border-white/20 p-3 rounded-xl font-mono text-xs text-green-400 overflow-x-auto">npm run zip-project</div>
                        <button onClick={() => handleCopyCommand('npm run zip-project')} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 p-2 rounded-lg active:scale-90"><Copy className="h-3 w-3" /></button>
                      </div>
                   </div>
                </div>

                <div className="flex items-start gap-4">
                   <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">2</div>
                   <p className="text-[11px] font-bold text-gray-300 uppercase leading-relaxed">Press <code className="bg-white/10 px-1 rounded text-primary font-black">Ctrl + Shift + E</code> to focus Sidebar Explorer.</p>
                </div>

                <div className="flex items-start gap-4">
                   <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">3</div>
                   <p className="text-[11px] font-bold text-gray-300 uppercase leading-relaxed">Arrow keys to select <code className="text-green-400 font-black">shopykart-source.zip</code> and press <code className="bg-white/10 px-1 rounded text-primary font-black">Shift + F10</code>.</p>
                </div>

                <div className="flex items-start gap-4">
                   <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">4</div>
                   <p className="text-[11px] font-bold text-gray-300 uppercase leading-relaxed">Arrow down to <code className="text-white font-black underline decoration-primary decoration-2">Download</code> and press Enter.</p>
                </div>
             </div>
          </div>
        </div>

        {/* ANDROID STUDIO GUIDE */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-border shadow-xl space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
             <Cpu className="h-40 w-40" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-green-600 p-3 rounded-2xl text-white shadow-lg shadow-green-200">
              <Monitor className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Native APK Build</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Requirements: Android Studio & Java on Laptop</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
             <div className="space-y-4">
                <ul className="space-y-3">
                   {[
                     "Extract the downloaded ZIP on your Laptop.",
                     "Open the extracted folder in Android Studio.",
                     "Wait for Gradle Sync to complete (1-3 mins).",
                     "Go to Menu: Build &gt; Build Bundle(s) / APK(s).",
                     "Select 'Build APK(s)' to generate the final installer."
                   ].map((step, i) => (
                     <li key={i} className="flex items-center gap-3 bg-muted/30 p-4 rounded-2xl border border-border/50">
                        <span className="h-6 w-6 rounded-full bg-black text-white flex items-center justify-center font-black text-[10px] shrink-0">{i+1}</span>
                        <span className="text-[10px] font-black uppercase text-gray-700" dangerouslySetInnerHTML={{ __html: step }} />
                     </li>
                   ))}
                </ul>
             </div>

             <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100 flex flex-col justify-center items-center text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-amber-600 animate-pulse" />
                <h4 className="font-black italic uppercase text-amber-800 text-lg">Build Notice</h4>
                <p className="text-[10px] font-bold text-amber-700/70 uppercase leading-relaxed max-w-[220px]">
                   APK build process (Gradle) Cloud environment par supported nahi hai. Aapko ye apne Laptop par hi karna hoga.
                </p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
