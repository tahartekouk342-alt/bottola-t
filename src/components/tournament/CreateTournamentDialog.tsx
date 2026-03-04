import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles, Trophy, Camera, X, Plus, Image, MapPin, Swords, Users, Layers } from 'lucide-react';
import { useTournaments } from '@/hooks/useTournaments';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { ORGANIZER_BASE } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type TournamentType = Database['public']['Enums']['tournament_type'];

interface CreateTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tournamentTypes = [
  { value: 'knockout' as TournamentType, label: 'إقصاء مباشر', icon: Swords, desc: 'من يخسر يخرج مباشرة', bg: 'from-red-500/20 to-orange-500/20' },
  { value: 'league' as TournamentType, label: 'دوري', icon: Trophy, desc: 'كل فريق يلعب ضد الجميع', bg: 'from-blue-500/20 to-cyan-500/20' },
  { value: 'groups' as TournamentType, label: 'مجموعات + إقصاء', icon: Layers, desc: 'مجموعات ثم مرحلة إقصاء', bg: 'from-purple-500/20 to-pink-500/20' },
];

export function CreateTournamentDialog({ open, onOpenChange }: CreateTournamentDialogProps) {
  const navigate = useNavigate();
  const { createTournament, addTeams, performAIDraw, generateKnockoutMatches, generateGroupMatches } = useTournaments();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Step 1
  const [name, setName] = useState('');
  const [type, setType] = useState<TournamentType>('knockout');
  const [startDate, setStartDate] = useState('');
  const [numGroups, setNumGroups] = useState(4);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [acceptJoinRequests, setAcceptJoinRequests] = useState(false);
  const [maxTeams, setMaxTeams] = useState<number | ''>('');

  // Stadium
  const [stadiumImageFile, setStadiumImageFile] = useState<File | null>(null);
  const [stadiumImagePreview, setStadiumImagePreview] = useState<string | null>(null);

  // Step 2
  const [teamsList, setTeamsList] = useState<string[]>([]);
  const [newTeamName, setNewTeamName] = useState('');

  // Step 3
  const [drawResult, setDrawResult] = useState<any>(null);

  const resetForm = () => {
    setStep(1); setName(''); setType('knockout'); setStartDate('');
    setNumGroups(4); setLogoFile(null); setLogoPreview(null);
    setVenueName(''); setVenueAddress(''); setAcceptJoinRequests(false);
    setMaxTeams(''); setStadiumImageFile(null); setStadiumImagePreview(null);
    setTeamsList([]); setNewTeamName(''); setDrawResult(null);
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleStadiumImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStadiumImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setStadiumImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddTeam = () => {
    if (newTeamName.trim() && !teamsList.includes(newTeamName.trim())) {
      setTeamsList(prev => [...prev, newTeamName.trim()]);
      setNewTeamName('');
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!name.trim()) {
        toast({ title: 'خطأ', description: 'يرجى إدخال اسم البطولة', variant: 'destructive' });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (teamsList.length < 2) {
        toast({ title: 'خطأ', description: 'يرجى إدخال فريقين على الأقل', variant: 'destructive' });
        return;
      }
      if (type === 'groups' && teamsList.length < numGroups * 2) {
        toast({ title: 'خطأ', description: `يجب إدخال ${numGroups * 2} فريق على الأقل للمجموعات`, variant: 'destructive' });
        return;
      }

      setAiLoading(true);
      try {
        const drawType = type === 'league' ? 'knockout' : type;
        const result = await performAIDraw(teamsList, drawType as TournamentType, type === 'groups' ? numGroups : undefined);
        if (result) {
          // For league, just shuffle
          if (type === 'league' && !result.draw) {
            result.draw = teamsList.sort(() => Math.random() - 0.5);
          }
          setDrawResult(result);
          setStep(3);
        }
      } finally {
        setAiLoading(false);
      }
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      let logoUrl: string | null = null;
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const filePath = `logos/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('tournament-assets').upload(filePath, logoFile);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('tournament-assets').getPublicUrl(filePath);
          logoUrl = publicUrl;
        }
      }

      let venuePhotos: string[] = [];
      if (stadiumImageFile) {
        const fileExt = stadiumImageFile.name.split('.').pop();
        const filePath = `stadiums/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('tournament-assets').upload(filePath, stadiumImageFile);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('tournament-assets').getPublicUrl(filePath);
          venuePhotos = [publicUrl];
        }
      }

      const tournament = await createTournament({
        name, type, startDate,
        numTeams: teamsList.length,
        numGroups: type === 'groups' ? numGroups : undefined,
        teamsPerGroup: type === 'groups' ? Math.ceil(teamsList.length / numGroups) : undefined,
        logoUrl, venueName, venueAddress,
        acceptJoinRequests,
        maxTeams: maxTeams ? Number(maxTeams) : undefined,
        venuePhotos,
      });

      if (!tournament) return;

      const orderedTeams = type === 'groups'
        ? Object.values(drawResult.groups || {}).flat()
        : drawResult.draw || teamsList;

      const teams = await addTeams(tournament.id, orderedTeams as string[]);
      if (!teams) return;

      if (type === 'knockout') {
        await generateKnockoutMatches(tournament.id, teams);
      } else if (type === 'groups' && drawResult.groups) {
        await generateGroupMatches(tournament.id, teams, drawResult.groups);
      } else if (type === 'league') {
        // Generate round-robin for league (no groups)
        await generateLeagueMatches(tournament.id, teams);
      }

      toast({ title: 'تم بنجاح! 🎉', description: 'تم إنشاء البطولة وإجراء القرعة' });
      onOpenChange(false);
      resetForm();
      navigate(`${ORGANIZER_BASE}/tournament/${tournament.id}`);
    } finally {
      setLoading(false);
    }
  };

  const generateLeagueMatches = async (tournamentId: string, teams: any[]) => {
    const allMatches: any[] = [];
    const allStandings: any[] = [];
    let matchOrder = 1;

    teams.forEach((team) => {
      allStandings.push({
        tournament_id: tournamentId, team_id: team.id, group_name: null,
        position: 0, played: 0, won: 0, drawn: 0, lost: 0,
        goals_for: 0, goals_against: 0, goal_difference: 0, points: 0,
      });
    });

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        allMatches.push({
          tournament_id: tournamentId,
          home_team_id: teams[i].id,
          away_team_id: teams[j].id,
          round: 1, match_order: matchOrder++,
          status: 'scheduled' as const,
        });
      }
    }

    if (allStandings.length > 0) {
      await supabase.from('standings').insert(allStandings);
    }
    if (allMatches.length > 0) {
      await supabase.from('matches').insert(allMatches);
    }
    await supabase.from('tournaments').update({ status: 'upcoming' }).eq('id', tournamentId);
  };

  const stepLabels = ['معلومات البطولة', 'الفرق المشاركة', 'نتيجة القرعة'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="w-6 h-6 text-primary" />
            إنشاء بطولة جديدة
          </DialogTitle>
          <DialogDescription>{stepLabels[step - 1]}</DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex items-center gap-2 my-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shrink-0',
                s === step ? 'bg-primary text-primary-foreground scale-110' : s < step ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              )}>{s}</div>
              {s < 3 && <div className={cn('h-1 flex-1 rounded-full', s < step ? 'bg-primary/40' : 'bg-muted')} />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3">
              <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="شعار" className="w-full h-full object-cover" />
                ) : (
                  <><Camera className="w-6 h-6 text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">شعار البطولة</span></>
                )}
                <input type="file" accept="image/*" onChange={handleLogoSelect} className="sr-only" />
              </label>
            </div>

            <div className="space-y-2">
              <Label>اسم البطولة</Label>
              <Input placeholder="مثال: بطولة الأبطال 2025" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            {/* Tournament Type Cards */}
            <div className="space-y-2">
              <Label>نظام البطولة</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {tournamentTypes.map((t) => (
                  <Card
                    key={t.value}
                    className={cn(
                      'cursor-pointer transition-all hover:scale-[1.02]',
                      type === t.value ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'
                    )}
                    onClick={() => setType(t.value)}
                  >
                    <CardContent className={cn('p-4 bg-gradient-to-br rounded-lg', t.bg)}>
                      <t.icon className={cn('w-8 h-8 mb-2', type === t.value ? 'text-primary' : 'text-muted-foreground')} />
                      <h4 className="font-bold text-sm">{t.label}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>تاريخ البداية</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            {type === 'groups' && (
              <div className="space-y-2">
                <Label>عدد المجموعات</Label>
                <Select value={numGroups.toString()} onValueChange={(v) => setNumGroups(parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 6, 8].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n} مجموعات</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Stadium */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />تفاصيل الملعب
                </h3>
                <label className="w-full h-32 rounded-2xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden">
                  {stadiumImagePreview ? (
                    <img src={stadiumImagePreview} alt="ملعب" className="w-full h-full object-cover" />
                  ) : (
                    <><Image className="w-8 h-8 text-muted-foreground mb-2" /><span className="text-xs text-muted-foreground">صورة الملعب</span></>
                  )}
                  <input type="file" accept="image/*" onChange={handleStadiumImageSelect} className="sr-only" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">اسم الملعب</Label>
                    <Input placeholder="ملعب المدينة" value={venueName} onChange={(e) => setVenueName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">العنوان</Label>
                    <Input placeholder="المدينة، الحي" value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Join Requests */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> استقبال طلبات الانضمام</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">السماح للفرق بإرسال طلبات</p>
                  </div>
                  <Switch checked={acceptJoinRequests} onCheckedChange={setAcceptJoinRequests} />
                </div>
                {acceptJoinRequests && (
                  <div className="space-y-1">
                    <Label className="text-xs">الحد الأقصى للفرق (اختياري)</Label>
                    <Input type="number" min={2} placeholder="بلا حد" value={maxTeams} onChange={(e) => setMaxTeams(e.target.value ? parseInt(e.target.value) : '')} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="اسم الفريق"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                className="flex-1"
              />
              <Button onClick={handleAddTeam} variant="outline" size="icon"><Plus className="w-4 h-4" /></Button>
            </div>

            {teamsList.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {teamsList.map((team, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 rounded-xl border bg-card group hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{index + 1}</span>
                      <span className="font-medium text-sm truncate">{team}</span>
                    </div>
                    <button onClick={() => setTeamsList(prev => prev.filter((_, i) => i !== index))} className="opacity-0 group-hover:opacity-100 text-destructive p-1 transition-opacity">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-sm text-muted-foreground text-center">
              عدد الفرق: <span className="font-bold text-foreground">{teamsList.length}</span>
              {type === 'groups' && <span className="text-xs"> (الحد الأدنى: {numGroups * 2})</span>}
            </p>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && drawResult && (
          <div className="space-y-6">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="font-bold text-primary">نتيجة القرعة</span>
                </div>

                {(type === 'knockout' || type === 'league') && drawResult.draw && (
                  <div className="space-y-2">
                    {type === 'knockout' ? (
                      (drawResult.draw as string[]).reduce((acc: JSX.Element[], team: string, index: number) => {
                        if (index % 2 === 0) {
                          const opponent = drawResult.draw[index + 1];
                          acc.push(
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/80">
                              <span className="font-medium">{team}</span>
                              <span className="text-xs font-bold text-muted-foreground px-2 py-1 rounded bg-muted">VS</span>
                              <span className="font-medium">{opponent}</span>
                            </div>
                          );
                        }
                        return acc;
                      }, [])
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(drawResult.draw as string[]).map((team: string, i: number) => (
                          <div key={i} className="p-2 rounded-lg bg-background/80 text-sm font-medium text-center">
                            {i + 1}. {team}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {type === 'groups' && drawResult.groups && (
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(drawResult.groups as Record<string, string[]>).map(([groupName, groupTeams]) => (
                      <div key={groupName} className="p-3 rounded-lg bg-background/80">
                        <h4 className="font-bold text-primary mb-2 text-sm">المجموعة {groupName}</h4>
                        <ul className="space-y-1">
                          {groupTeams.map((team, i) => (
                            <li key={i} className="text-sm flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                              {team}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>السابق</Button>}
          <div className="flex-1" />
          {step < 3 ? (
            <Button onClick={handleNext} disabled={aiLoading}>
              {aiLoading ? (
                <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري القرعة...</>
              ) : step === 2 ? (
                <><Sparkles className="w-4 h-4 ml-2" />إجراء القرعة</>
              ) : 'التالي'}
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? (
                <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري الإنشاء...</>
              ) : (
                <><Trophy className="w-4 h-4 ml-2" />إنشاء البطولة</>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
