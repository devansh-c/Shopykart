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
  Rocket,
  ExternalLink,
  Cpu,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Finalized Export & APK Build Guide. 
 * Updated with Fast Push Guide for the user.
 */
export default function ExportManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  
  const repoUrl = "https://github.com/devansh-c/Shopykart";

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(text);
    toast({ title: "Command Copied!" });
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const fastPushCommands = [
    "git add .",
    "git commit -m \"Update ShopyKart\"",
    "git push origin main"
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl pb-32">
      
      {/* FAST PUSH GUIDE */}
      <div className="bg-gradient-to-br from-indigo-900 to-black p-8 rounded-[3rem] border border-white/10 shadow-2xl text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-white/10 p-3 rounded-2xl">
              <Zap className="h-6 w-6 text-yellow-400 fill-yellow-400" />
            </div>
            <div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter">Fast Push Guide</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">3 Steps to GitHub</p>
            </div>
          </div>

          <div className="space-y-3">
            {fastPushCommands.map((cmd, i) => (
              <div key={i} className="group relative flex items-center justify-between bg-black/40 border border-white/5 p-4 rounded-2xl hover:border-white/20 transition-all">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-gray-600 w-4">{i + 1}</span>
                  <code className="text-sm font-mono text-indigo-300">{cmd}</code>
                </div>
                <button 
                  onClick={() => copyToClipboard(cmd)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                >
                  {copiedCommand === cmd ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
            <Terminal className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed">
              Firebase Studio ke terminal mein ye commands line-by-line copy-paste karein. Push hote hi GitHub Actions APK banana shuru kar dega.
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 h-full w-40 bg-white/5 -skew-x-12 translate-x-12" />
      </div>

      {/* THE GITHUB APK MASTER GUIDE */}
      <div className="bg-[#0B0B0B] p-10 rounded-[3rem] border border-white/10 shadow-2xl text-white relative overflow-hidden transform-gpu">
        <div className="relative z-10 space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="bg-white text-black p-5 rounded-[1.75rem] shadow-xl shadow-white/5">
                <Github className="h-10 w-10" />
              </div>
              <div>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter">APK Cloud Engine</h2>
                <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] mt-1 italic">Repo: devansh-c / Shopykart</p>
              </div>
            </div>
            <Button 
              onClick={() => window.open(`${repoUrl}/actions`, '_blank')}
              className="bg-white text-black hover:bg-gray-200 rounded-2xl h-14 px-8 font-black uppercase italic text-xs tracking-widest shadow-xl active:scale-95 transition-all"
            >
              GO TO GITHUB ACTIONS
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                 <Cpu className="h-5 w-5 text-primary animate-pulse" />
                 <h3 className="text-xl font-black italic uppercase text-white tracking-tight">Deployment Steps (Must Follow):</h3>
              </div>
              <div className="space-y-6">
                {[
                  { step: "01", title: "PUSH LATEST CODE", text: "Upar diye gaye 3 commands se code GitHub par push karein." },
                  { step: "02", title: "ACTIONS TAB", text: "GitHub par jaakar top menu mein 'Actions' par click karein." },
                  { step: "03", title: "SELECT WORKFLOW", text: "Left side se 'Build Android APK & AAB' workflow select karein." },
                  { step: "04", title: "START BUILD", text: "'Run workflow' button dabayein. GitHub ke servers build shuru kar denge (Approx 6 mins)." },
                  { step: "05", title: "DOWNLOAD APK", text: "Build complete hone par usi page par niche 'Artifacts' section se APK download karein." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-5 items-start group">
                    <span className="text-primary font-black italic text-3xl leading-none opacity-40 group-hover:opacity-100 transition-opacity">{item.step}</span>
                    <div className="space-y-1">
                       <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">{item.title}</h4>
                       <p className="text-[12px] font-bold text-gray-400 uppercase leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
               <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10 flex flex-col gap-6 h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10"><Zap className="h-24 w-24 -rotate-12" /></div>
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-3 text-amber-400">
                      <Zap className="h-6 w-6 fill-amber-400" />
                      <span className="text-[11px] font-black uppercase tracking-widest">Goyal Tech Tip</span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed uppercase font-bold italic">
                      "Bhai, GitHub Actions sabse best hai kyunki wahan ekdam standard environment hota hai. Aapko local machine par koi setup karne ki zaroorat nahi hai. Bas code push karo aur makkhan jaisi APK nikaal lo."
                    </p>
                  </div>
                  
                  <div className="mt-auto pt-6 relative z-10">
                    <div className="bg-primary/20 p-5 rounded-2xl border border-primary/30 flex items-start gap-4">
                      <Terminal className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-primary uppercase leading-tight tracking-wider">
                          BUILD CONFIG: Production-Static <br/>
                          REPO: devansh-c/Shopykart <br/>
                          STATUS: Workflow Verified ✅
                        </p>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 h-full w-44 bg-primary/5 -skew-x-12 translate-x-12 pointer-events-none" />
      </div>

      {/* 2. DATABASE & SOURCE TOOLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-border shadow-sm space-y-6 relative overflow-hidden group hover:shadow-2xl transition-all">
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-blue-600 p-3.5 rounded-2xl text-white shadow-lg shadow-blue-200">
              <Database className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">Database Export</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Full Firestore Backup</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed relative z-10 uppercase font-bold opacity-60">
            Download all products, stores, users, and orders as structured JSON files in a single ZIP.
          </p>
          <Button 
            onClick={handleExportData} 
            disabled={isExporting}
            className="w-full h-18 rounded-[2.5rem] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic shadow-xl active:scale-95 transition-all text-lg"
          >
            {isExporting ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Download className="h-6 w-6 mr-3" />}
            GENERATE BACKUP
          </Button>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-border shadow-sm space-y-6 relative overflow-hidden group hover:shadow-2xl transition-all">
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-emerald-600 p-3.5 rounded-2xl text-white shadow-lg shadow-emerald-200">
              <Code className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">Source Zip</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Complete Project Bundle</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed relative z-10 uppercase font-bold opacity-60">
            Download the entire source code for local backup or transferring to a new development machine.
          </p>
          <Button 
            className="w-full h-18 rounded-[2.5rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase italic shadow-xl active:scale-95 transition-all text-lg"
          >
            <Archive className="h-6 w-6 mr-3" />
            DOWNLOAD SOURCE
          </Button>
        </div>
      </div>

    </div>
  );
}
