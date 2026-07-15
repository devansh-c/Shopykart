"use client"

import { useState } from 'react';
import { Plus, Trash2, Edit, FileText, Loader2, Info, Globe, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn, slugify } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function PageManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const pagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'pages'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: pages, loading } = useCollection<any>(pagesQuery);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: ''
  });

  const handleSave = async () => {
    if (!firestore || !formData.title || !formData.content) {
      toast({ variant: "destructive", title: "Missing Fields" });
      return;
    }

    setIsProcessing(true);
    const finalSlug = formData.slug.trim().toLowerCase().replace(/\s+/g, '-') || slugify(formData.title);
    
    const pageData = {
      title: formData.title.trim(),
      slug: finalSlug,
      content: formData.content,
      updatedAt: serverTimestamp(),
      createdAt: editingId ? (pages?.find(p => p.id === editingId)?.createdAt || serverTimestamp()) : serverTimestamp()
    };

    try {
      if (editingId) {
        await updateDoc(doc(firestore, 'pages', editingId), pageData);
        toast({ title: "Page Updated" });
      } else {
        await addDoc(collection(firestore, 'pages'), pageData);
        toast({ title: "Page Published! 🚀" });
      }
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      toast({ variant: "destructive", title: "Save Error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', slug: '', content: '' });
    setEditingId(null);
  };

  const handleEdit = (page: any) => {
    setEditingId(page.id);
    setFormData({
      title: page.title,
      slug: page.slug || '',
      content: page.content
    });
    setIsAddOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (confirm("Delete this page?")) {
      await deleteDoc(doc(firestore, 'pages', id));
      toast({ title: "Page Deleted" });
    }
  };

  const copyLink = (page: any) => {
    const slug = page.slug || slugify(page.title);
    const url = `${window.location.origin}/page/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Super SEO Link Copied!" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black italic uppercase">Super SEO Pages</h2>
          <p className="text-xs text-muted-foreground font-bold">IDs removed from URLs for maximum ranking</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(val) => { setIsAddOpen(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#0B0B0B] hover:bg-primary rounded-xl font-black uppercase italic">
              <Plus className="h-4 w-4 mr-2" />
              NEW POLICY PAGE
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="font-black italic uppercase text-center">Super SEO Page Composer</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Page Title *</label>
                    <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Return Policy" className="h-12 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-primary ml-1 flex items-center gap-1.5"><Globe className="h-2.5 w-2.5" /> URL Path (Slug)</label>
                    <Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="return-policy" className="h-12 rounded-xl bg-primary/5 border-primary/10 font-black italic" />
                  </div>
               </div>
               <Textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Content Editor..." className="min-h-[350px] rounded-2xl p-6 bg-muted/10" />
            </div>
            <div className="p-6 bg-muted/5 border-t">
               <Button onClick={handleSave} disabled={isProcessing} className="w-full h-16 rounded-[2rem] bg-primary font-black uppercase italic shadow-xl text-lg">
                 {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : 'ACTIVATE LIVE PAGE'}
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pages?.map((page: any) => (
          <div key={page.id} className="bg-white p-5 rounded-[2.5rem] border border-border shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
            <div className="flex items-center gap-4 min-w-0">
               <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                  <FileText className="h-6 w-6" />
               </div>
               <div className="min-w-0">
                  <h3 className="font-black italic uppercase text-lg leading-none mb-1 truncate">{page.title}</h3>
                  <p className="text-[11px] font-black text-primary uppercase italic tracking-tighter truncate">/page/{page.slug || slugify(page.title)}</p>
               </div>
            </div>
            <div className="flex gap-2">
               <Button onClick={() => copyLink(page)} variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-primary/5 text-primary"><LinkIcon className="h-4 w-4" /></Button>
               <Button onClick={() => handleEdit(page)} variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600"><Edit className="h-4 w-4" /></Button>
               <Button onClick={() => handleDelete(page.id)} variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
