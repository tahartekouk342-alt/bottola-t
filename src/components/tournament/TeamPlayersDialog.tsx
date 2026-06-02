import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Loader2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  team: { id: string; name: string } | null;
}

export function TeamPlayersDialog({ open, onOpenChange, team }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  // form
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [number, setNumber] = useState<number>(1);
  const [position, setPosition] = useState('midfielder');
  const [birthDate, setBirthDate] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: players = [] } = useQuery({
    queryKey: ['team-players', team?.id],
    queryFn: async () => {
      if (!team) return [];
      const { data } = await supabase.from('players').select('id, name, nickname, number, position, photo_url, birth_date').eq('team_id', team.id).order('number');
      return data || [];
    },
    enabled: !!team && open,
  });

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    const r = new FileReader();
    r.onload = () => setPhotoPreview(r.result as string);
    r.readAsDataURL(f);
  };

  const resetForm = () => {
    setName(''); setNickname(''); setNumber(1); setPosition('midfielder');
    setBirthDate(''); setPhotoFile(null); setPhotoPreview(null);
  };

  const addPlayer = async () => {
    if (!name.trim() || !team) return;
    setSaving(true);
    try {
      let photo_url: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split('.').pop();
        const path = `players/${team.id}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('tournament-assets').upload(path, photoFile);
        if (!error) photo_url = supabase.storage.from('tournament-assets').getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from('players').insert({
        team_id: team.id,
        name: name.trim(),
        nickname: nickname.trim() || null,
        number: number || 1,
        position,
        birth_date: birthDate || null,
        photo_url,
      });
      if (error) throw error;
      toast({ title: 'تمت إضافة اللاعب ✅' });
      qc.invalidateQueries({ queryKey: ['team-players', team.id] });
      qc.invalidateQueries({ queryKey: ['org-teams'] });
      resetForm(); setShowAdd(false);
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const bulkDelete = async () => {
    if (!selected.length) return;
    if (!confirm(`حذف ${selected.length} لاعبين؟`)) return;
    const { error } = await supabase.from('players').delete().in('id', selected);
    if (error) { toast({ title: 'خطأ', variant: 'destructive' }); return; }
    toast({ title: 'تم الحذف ✅' });
    setSelected([]);
    qc.invalidateQueries({ queryKey: ['team-players', team?.id] });
    qc.invalidateQueries({ queryKey: ['org-teams'] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>لاعبو {team?.name}</DialogTitle>
        </DialogHeader>

        {!showAdd && (
          <>
            <div className="flex items-center justify-between mb-2">
              <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 me-1" /> إضافة لاعب</Button>
              {selected.length > 0 && (
                <Button size="sm" variant="destructive" onClick={bulkDelete}>
                  <Trash2 className="w-4 h-4 me-1" /> حذف ({selected.length})
                </Button>
              )}
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {players.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">لا يوجد لاعبون بعد</p>}
              {players.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                  <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                  <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs">
                    {p.photo_url ? <img src={p.photo_url} className="w-full h-full object-cover" /> : '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.name} {p.nickname && <span className="text-muted-foreground text-xs">({p.nickname})</span>}</p>
                    <p className="text-[11px] text-muted-foreground">#{p.number} · {p.position}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {showAdd && (
          <div className="space-y-3">
            <div className="flex justify-center">
              <label className="w-20 h-20 rounded-full border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <Camera className="w-5 h-5 text-muted-foreground" />}
                <input type="file" accept="image/*" onChange={onPhoto} className="sr-only" />
              </label>
            </div>
            <div className="space-y-1"><Label>الاسم *</Label><Input value={name} onChange={e => setName(e.target.value)} maxLength={60} /></div>
            <div className="space-y-1"><Label>اللقب (اختياري)</Label><Input value={nickname} onChange={e => setNickname(e.target.value)} maxLength={40} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>رقم القميص</Label><Input type="number" value={number} onChange={e => setNumber(parseInt(e.target.value) || 1)} min={1} max={99} /></div>
              <div className="space-y-1"><Label>المركز</Label>
                <select value={position} onChange={e => setPosition(e.target.value)} className="w-full h-10 px-2 rounded-md border border-input bg-background text-sm">
                  <option value="goalkeeper">حارس مرمى</option>
                  <option value="defender">مدافع</option>
                  <option value="midfielder">وسط</option>
                  <option value="forward">مهاجم</option>
                </select>
              </div>
            </div>
            <div className="space-y-1"><Label>تاريخ الميلاد (اختياري)</Label><Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} /></div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowAdd(false); resetForm(); }}>إلغاء</Button>
              <Button className="flex-1" onClick={addPlayer} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ اللاعب'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
