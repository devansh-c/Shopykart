
"use client"

import { useState } from 'react';
import { Plus, Trash2, Edit, FileText, Loader2, Info, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function PageManagement() {
  const firestore = useFirestore();
  
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
    if (!firestore || !formData.title || !formData.content) return;

    setIsProcessing(true);
    const slug = formData.slug.trim() || formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const pageData = {
      title: formData.title.trim(),
      slug: slug,
      content: formData.content,
      updatedAt: serverTimestamp(),
      createdAt: editingId ? (pages?.find(p => p.id === editingId)?.createdAt || serverTimestamp()) : serverTimestamp()
    };

    try {
      if (editingId) {
        await updateDoc(doc(firestore, 'pages', editingId), pageData);
      } else {
        await addDoc(collection(firestore, 'pages'), pageData);
      }
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      console.error("Save error:", err);
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
      slug: page.slug,
      content: page.content
    });
    setIsAddOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (confirm("Delete this page permanently?")) {
      await deleteDoc(doc(firestore, 'pages', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black italic uppercase">Dynamic Pages</h2>
          <p className="text-xs text-muted-foreground font-bold">Privacy, Terms, About, etc.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(val) => { setIsAddOpen(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#0B0B0B] hover:bg-primary rounded-xl font-black uppercase italic">
              <Plus className="h-4 w-4 mr-2" />
              Create New Page
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="font-black italic uppercase text-center">{editingId ? 'Edit Page' : 'New Page Composer'}</DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-2 space-y-4">
               <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Page Title</label>
                  <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Privacy Policy" className="h-12 rounded-xl font-bold" />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Slug (URL path)</label>
                  <Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="privacy-policy" className="h-12 rounded-xl bg-muted/30" />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Content (Raw Text or simple HTML)</label>
                  <Textarea 
                    value={formData.content} 
                    onChange={e => setFormData({...formData, content: e.target.value})} 
                    placeholder="Write page content here..." 
                    className="min-h-[300px] rounded-2xl font-medium"
                  />
               </div>
            </div>

            <div className="p-6 bg-muted/5 border-t">
               <Button onClick={handleSave} disabled={isProcessing} className="w-full h-16 rounded-[2rem] bg-primary font-black uppercase italic shadow-xl">
                 {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : editingId ? 'UPDATE PAGE' : 'PUBLISH PAGE'}
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && !pages ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : pages && pages.length > 0 ? (
          pages.map((page) => (
            <div key={page.id} className="bg-white p-5 rounded-[2rem] border border-border shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                    <FileText className="h-6 w-6" />
                 </div>
                 <div>
                    <h3 className="font-black italic uppercase text-lg leading-none mb-1">{page.title}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">URL: /pages/view?id={page.id}</p>
                 </div>
              </div>
              <div className="flex gap-2">
                 <Button onClick={() => handleEdit(page)} variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600">
                    <Edit className="h-4 w-4" />
                 </Button>
                 <Button onClick={() => handleDelete(page.id)} variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-red-50 text-red-500">
                    <Trash2 className="h-4 w-4" />
                 </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No policy pages created yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
