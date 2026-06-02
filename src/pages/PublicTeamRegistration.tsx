import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PublicTeamRegistration() {
  const { token } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<any>(null);
  const [teamCount, setTeamCount] = useState(0);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [playerNames, setPlayerNames] = useState('');

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data: t } = await supabase.from('tournaments').select('id, name, logo_url, sport_type, max_teams, registration_open, registration_closes_at').eq('registration_token', token).maybeSingle();
      setTournament(t);
      if (t) {
        const { count } = await supabase.from('teams').select('id', { count: 'exact', head: true }).eq('tournament_id', t.id);
        setTeamCount(count || 0);
      }
      setLoading(false);
    })();
  }, [token]);

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setLogoFile(f);
    const r = new FileReader();
    r.onload = () => setLogoPreview(r.result as string);
    r.readAsDataURL(f);
  };

  const isFull = tournament?.max_teams && teamCount >= tournament.max_teams;
  const isClosed = !tournament?.registration_open || isFull
    || (tournament?.registration_closes_at && new Date(tournament.registration_closes_at) < new Date());

  const submit = async () => {
    if (!name.trim() || !tournament) return;
    setSubmitting(true);
    try {
      let logo_url: string | null = null;
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `public-registrations/${tournament.id}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('tournament-assets').upload(path, logoFile);
        if (!error) logo_url = supabase.storage.from('tournament-assets').getPublicUrl(path).data.publicUrl;
      }
      const players = playerNames.split('\n').map(s => s.trim()).filter(Boolean);
      const { error } = await supabase.from('join_requests').insert({
        tournament_id: tournament.id,
        team_name: name.trim(),
        team_logo_url: logo_url,
        player_names: players,
        player_photos: [],
        status: 'pending',
      });
      if (error) throw error;
      setDone(true);
      toast({ title: 'تم إرسال طلب التسجيل ✅' });
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!tournament) return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-md w-full"><CardContent className="p-8 text-center">
        <XCircle className="w-12 h-12 mx-auto mb-3 text-destructive" />
        <p className="font-bold">رابط التسجيل غير صالح</p>
      </CardContent></Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center" dir="rtl">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {tournament.logo_url && <img src={tournament.logo_url} className="w-16 h-16 rounded-xl mx-auto mb-3 object-cover" />}
          <CardTitle>{tournament.name}</CardTitle>
          <p className="text-sm text-muted-foreground">تسجيل فريق جديد</p>
          <p className="text-xs text-muted-foreground">الفرق المسجلة: {teamCount}{tournament.max_teams ? ` / ${tournament.max_teams}` : ''}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {done ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-14 h-14 mx-auto text-primary mb-3" />
              <p className="font-bold mb-1">تم استلام طلبك</p>
              <p className="text-sm text-muted-foreground">سيتم مراجعته من قبل المنظم</p>
            </div>
          ) : isClosed ? (
            <div className="text-center py-6">
              <XCircle className="w-12 h-12 mx-auto text-destructive mb-3" />
              <p className="font-bold">التسجيل مغلق</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isFull ? 'تم الوصول للحد الأقصى من الفرق' : 'انتهت فترة التسجيل'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <label className="w-20 h-20 rounded-2xl border-2 border-dashed bg-muted/50 flex items-center justify-center cursor-pointer overflow-hidden">
                  {logoPreview ? <img src={logoPreview} className="w-full h-full object-cover" /> : <Camera className="w-5 h-5 text-muted-foreground" />}
                  <input type="file" accept="image/*" onChange={onLogo} className="sr-only" />
                </label>
              </div>
              <div className="space-y-1"><Label>اسم الفريق *</Label><Input value={name} onChange={e => setName(e.target.value)} maxLength={60} /></div>
              <div className="space-y-1">
                <Label>أسماء اللاعبين (سطر لكل لاعب)</Label>
                <textarea value={playerNames} onChange={e => setPlayerNames(e.target.value)} rows={5} maxLength={2000}
                  className="w-full p-2 rounded-md border border-input bg-background text-sm" />
              </div>
              <Button className="w-full" onClick={submit} disabled={submitting || !name.trim()}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إرسال الطلب'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
