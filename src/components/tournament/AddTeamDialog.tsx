import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tournamentId?: string | null;
  defaultSport?: 'football' | 'basketball' | 'volleyball';
}

const SPORTS = [
  { v: 'football', label: 'كرة قدم', icon: '⚽' },
  { v: 'basketball', label: 'كرة سلة', icon: '🏀' },
  { v: 'volleyball', label: 'كرة طائرة', icon: '🏐' },
] as const;

export function AddTeamDialog({ open, onOpenChange, tournamentId = null, defaultSport = 'football' }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [sport, setSport] = useState<'football' | 'basketball' | 'volleyball'>(defaultSport);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setLogoFile(f);
    const r = new FileReader();
    r.onload = () => setLogoPreview(r.result as string);
    r.readAsDataURL(f);
  };

  const reset = () => {
    setName(''); setNickname(''); setSport(defaultSport);
    setLogoFile(null); setLogoPreview(null);
  };

  const onSave = async () => {
    if (!name.trim() || !user) {
      toast({ title: 'الاسم مطلوب', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      let logo_url: string | null = null;
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `teams/${user.id}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('tournament-assets').upload(path, logoFile);
        if (!error) {
          logo_url = supabase.storage.from('tournament-assets').getPublicUrl(path).data.publicUrl;
        }
      }
      const { error } = await supabase.from('teams').insert({
        name: name.trim(),
        nickname: nickname.trim() || null,
        sport_type: sport,
        logo_url,
        tournament_id: tournamentId,
        organizer_id: user.id,
      });
      if (error) throw error;
      toast({ title: 'تم إضافة الفريق ✅' });
      qc.invalidateQueries({ queryKey: ['org-teams'] });
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة فريق جديد</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center">
            <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:border-primary/50">
              {logoPreview ? <img src={logoPreview} className="w-full h-full object-cover" /> : (
                <><Camera className="w-6 h-6 text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">شعار</span></>
              )}
              <input type="file" accept="image/*" onChange={onLogo} className="sr-only" />
            </label>
          </div>
          <div className="space-y-2">
            <Label>اسم الفريق *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} maxLength={60} placeholder="مثال: نادي الاتحاد" />
          </div>
          <div className="space-y-2">
            <Label>اللقب (اختياري)</Label>
            <Input value={nickname} onChange={e => setNickname(e.target.value)} maxLength={40} placeholder="مثال: العميد" />
          </div>
          <div className="space-y-2">
            <Label>الرياضة</Label>
            <div className="grid grid-cols-3 gap-2">
              {SPORTS.map(s => (
                <Card key={s.v} onClick={() => setSport(s.v)}
                  className={cn('cursor-pointer transition', sport === s.v ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50')}>
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl">{s.icon}</div>
                    <div className="text-xs font-bold mt-1">{s.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button className="flex-1" onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
