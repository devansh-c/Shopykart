"use client"

import { useState } from 'react';
import { Plus, Trash2, Edit, ShieldCheck, Loader2, UserPlus, KeyRound, Check, X, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

const PERMISSIONS = [
  { id: 'zones', label: 'Zones' },
  { id: 'customers', label: 'Customers' },
  { id: 'stores', label: 'Stores' },
  { id: 'fleet', label: 'Fleet' },
  { id: 'orders', label: 'Orders' },
  { id: 'products', label: 'Products' },
  { id: 'payouts', label: 'Payouts' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'design', label: 'Banners' },
];

export default function TeamManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const teamQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'team_members'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: members, loading } = useCollection<any>(teamQuery);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    employeeId: '',
    password: '',
    permissions: [] as string[]
  });

  const handleTogglePermission = (pId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(pId)
        ? prev.permissions.filter(id => id !== pId)
        : [...prev.permissions, pId]
    }));
  };

  const handleSave = async () => {
    if (!firestore || !formData.fullName || !formData.employeeId || !formData.password) {
      toast({ variant: "destructive", title: "Missing Fields" });
      return;
    }

    setIsProcessing(true);
    const memberData = {
      fullName: formData.fullName.trim(),
      employeeId: formData.employeeId.trim().toLowerCase(),
      password: formData.password.trim(),
      permissions: formData.permissions,
      updatedAt: serverTimestamp(),
      createdAt: editingId ? (members?.find(m => m.id === editingId)?.createdAt || serverTimestamp()) : serverTimestamp()
    };

    try {
      if (editingId) {
        await updateDoc(doc(firestore, 'team_members', editingId), memberData);
        toast({ title: "Member Updated" });
      } else {
        await addDoc(collection(firestore, 'team_members'), memberData);
        toast({ title: "Team Member Added", description: `Access granted for ${formData.fullName}` });
      }
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      toast({ variant: "destructive", title: "Error Saving" });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({ fullName: '', employeeId: '', password: '', permissions: [] });
    setEditingId(null);
  };

  const handleEdit = (member: any) => {
    setEditingId(member.id);
    setFormData({
      fullName: member.fullName,
      employeeId: member.employeeId,
      password: member.password,
      permissions: member.permissions || []
    });
    setIsAddOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (confirm("Revoke all access for this member?")) {
      await deleteDoc(doc(firestore, 'team_members', id));
      toast({ title: "Access Revoked" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black italic uppercase">Manage Team</h2>
          <p className="text-xs text-muted-foreground font-bold">Assign IDs and Permissions</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(val) => { setIsAddOpen(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#0B0B0B] hover:bg-primary rounded-xl font-black uppercase italic text-[10px] tracking-widest">
              <UserPlus className="h-4 w-4 mr-2" />
              ADD NEW MEMBER
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] max-w-md p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[90vh]">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="font-black italic uppercase text-center text-xl">Member Assignment</DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-0 space-y-6">
               <div className="space-y-4">
                  <div className="space-y-1">
                     <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Full Name</label>
                     <Input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="e.g. Rahul Singh" className="h-12 rounded-xl font-bold bg-muted/20 border-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Login ID</label>
                       <Input value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value.replace(/\s/g, '')})} placeholder="TeamRahul1" className="h-12 rounded-xl font-bold bg-muted/20 border-none uppercase" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Password</label>
                       <Input value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" className="h-12 rounded-xl font-bold bg-muted/20 border-none" />
                    </div>
                  </div>
               </div>

               <div className="space-y-4 border-t border-dashed pt-6">
                  <div className="flex items-center gap-2">
                     <ShieldCheck className="h-4 w-4 text-primary" />
                     <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-800">Assign Operations</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     {PERMISSIONS.map(p => (
                       <div 
                        key={p.id} 
                        onClick={() => handleTogglePermission(p.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer",
                          formData.permissions.includes(p.id) ? "border-primary bg-primary/5" : "border-gray-50 bg-gray-50"
                        )}
                       >
                          <div className={cn(
                            "h-4 w-4 rounded-md border-2 flex items-center justify-center transition-colors",
                            formData.permissions.includes(p.id) ? "bg-primary border-primary" : "bg-white border-gray-300"
                          )}>
                             {formData.permissions.includes(p.id) && <Check className="h-2.5 w-2.5 text-white stroke-[4]" />}
                          </div>
                          <span className="text-[10px] font-black uppercase italic tracking-tighter">{p.label}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="p-8 bg-muted/5 border-t">
               <Button onClick={handleSave} disabled={isProcessing} className="w-full h-16 rounded-[2rem] bg-black text-white font-black uppercase italic shadow-xl">
                 {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : editingId ? 'UPDATE MEMBER' : 'CREATE TEAM ID'}
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && !members ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : members && members.length > 0 ? (
          members.map((member) => (
            <div key={member.id} className="bg-white p-6 rounded-[2.5rem] border border-border shadow-sm flex flex-col group hover:shadow-xl transition-all">
              <div className="flex items-center gap-4 mb-5">
                 <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                    <ShieldCheck className="h-7 w-7" />
                 </div>
                 <div>
                    <h3 className="font-black italic uppercase text-lg leading-none mb-1">{member.fullName}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ID: {member.employeeId.toUpperCase()}</p>
                 </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl mb-6 flex-1">
                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Assigned Permissions</p>
                 <div className="flex flex-wrap gap-1.5">
                    {member.permissions?.length > 0 ? member.permissions.map((pId: string) => (
                      <span key={pId} className="bg-white px-2 py-1 rounded-lg border border-gray-200 text-[8px] font-black uppercase text-gray-500">
                        {PERMISSIONS.find(p => p.id === pId)?.label || pId}
                      </span>
                    )) : (
                      <span className="text-[10px] font-bold text-red-400 italic uppercase">No Permissions Assigned</span>
                    )}
                 </div>
              </div>

              <div className="flex gap-2">
                 <Button onClick={() => handleEdit(member)} variant="outline" className="flex-1 rounded-xl h-10 font-black uppercase italic text-[10px] border-primary/20 text-primary">
                   <Edit className="h-3.5 w-3.5 mr-2" /> EDIT
                 </Button>
                 <Button onClick={() => handleDelete(member.id)} variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-red-50 text-red-500">
                   <Trash2 className="h-4 w-4" />
                 </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed">
            <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No team members active</p>
          </div>
        )}
      </div>
    </div>
  );
}
