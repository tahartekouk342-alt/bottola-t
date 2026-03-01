import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, Plus, X, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface JoinRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  tournamentName: string;
}

export function JoinRequestDialog({ open, onOpenChange, tournamentId, tournamentName }: JoinRequestDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teamName, setTeamName] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [newPlayer, setNewPlayer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddPlayer = () => {
    if (newPlayer.trim()) {
      setPlayerNames(prev => [...prev, newPlayer.trim()]);
      setNewPlayer('');
    }
  };

  const handleSubmit = async () => {
    if (!teamName.trim()) {
      toast({ title: 'يرجى إدخال اسم الفريق', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      let logoUrl: string | null = null;
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const filePath = `team-logos/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('tournament-assets').upload(filePath, logoFile);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('tournament-assets').getPublicUrl(filePath);
          logoUrl = publicUrl;
        }
      }

      const { error } = await supabase.from('join_requests').insert({
        tournament_id: tournamentId,
        team_name: teamName.trim(),
        team_logo_url: logoUrl,
        player_names: playerNames,
        requested_by: user?.id || null,
      });

      if (error) throw error;

      toast({ title: 'تم إرسال طلب الانضمام ✅', description: 'سيقوم المنظم بمراجعة طلبك' });
      onOpenChange(false);
      setTeamName('');
      setLogoPreview(null);
      setLogoFile(null);
      setPlayerNames([]);
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>طلب الانضمام</DialogTitle>
          <DialogDescription>أرسل طلب انضمام فريقك إلى {tournamentName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Team Logo */}
          <div className="flex justify-center">
            <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="شعار" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-[10px] text-muted-foreground">شعار الفريق</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleLogoSelect} className="sr-only" />
            </label>
          </div>

          {/* Team Name */}
          <div className="space-y-2">
            <Label>اسم الفريق</Label>
            <Input placeholder="أدخل اسم فريقك" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          </div>

          {/* Players */}
          <div className="space-y-2">
            <Label>أسماء اللاعبين (اختياري)</Label>
            <div className="flex gap-2">
              <Input placeholder="اسم اللاعب" value={newPlayer} onChange={(e) => setNewPlayer(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()} className="flex-1" />
              <Button onClick={handleAddPlayer} variant="outline" size="icon"><Plus className="w-4 h-4" /></Button>
            </div>
            {playerNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {playerNames.map((name, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-muted">
                    {name}
                    <button onClick={() => setPlayerNames(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full gradient-primary text-primary-foreground">
            {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Send className="w-4 h-4 ml-2" />}
            إرسال طلب الانضمام
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
