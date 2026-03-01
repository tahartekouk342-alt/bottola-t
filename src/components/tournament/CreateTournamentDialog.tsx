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
import { Loader2, Sparkles, Trophy, Upload, Camera, X, Plus } from 'lucide-react';
import { useTournaments } from '@/hooks/useTournaments';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { ORGANIZER_BASE } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';

type TournamentType = Database['public']['Enums']['tournament_type'];

interface CreateTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
  const [numTeams, setNumTeams] = useState(8);
  const [numGroups, setNumGroups] = useState(4);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [acceptJoinRequests, setAcceptJoinRequests] = useState(false);
  const [maxTeams, setMaxTeams] = useState(16);

  // Step 2: Teams (individual entry)
  const [teamsList, setTeamsList] = useState<string[]>([]);
  const [newTeamName, setNewTeamName] = useState('');

  // Step 3
  const [drawResult, setDrawResult] = useState<any>(null);

  const resetForm = () => {
    setStep(1);
    setName('');
    setType('knockout');
    setStartDate('');
    setNumTeams(8);
    setNumGroups(4);
    setLogoFile(null);
    setLogoPreview(null);
    setVenueName('');
    setVenueAddress('');
    setAcceptJoinRequests(false);
    setMaxTeams(16);
    setTeamsList([]);
    setNewTeamName('');
    setDrawResult(null);
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddTeam = () => {
    if (newTeamName.trim() && !teamsList.includes(newTeamName.trim())) {
      setTeamsList(prev => [...prev, newTeamName.trim()]);
      setNewTeamName('');
    }
  };

  const handleRemoveTeam = (index: number) => {
    setTeamsList(prev => prev.filter((_, i) => i !== index));
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

      if (type === 'knockout' && teamsList.length !== numTeams) {
        toast({ title: 'خطأ', description: `يجب إدخال ${numTeams} فريق`, variant: 'destructive' });
        return;
      }

      setAiLoading(true);
      try {
        const adjustedType = type === 'groups' ? 'groups' : 'knockout';
        const result = await performAIDraw(teamsList, adjustedType as TournamentType, numGroups);
        if (result) {
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
      // Upload logo if exists
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

      const tournament = await createTournament({
        name,
        type,
        startDate,
        numTeams,
        numGroups,
        logoUrl,
        venueName,
        venueAddress,
        acceptJoinRequests,
        maxTeams,
      });

      if (!tournament) return;

      // Get ordered teams from draw
      const orderedTeams =
        type === 'groups'
          ? Object.values(drawResult.groups || {}).flat()
          : drawResult.draw || [];

      const teams = await addTeams(tournament.id, orderedTeams as string[]);
      if (!teams) return;

      if (type === 'knockout') {
        await generateKnockoutMatches(tournament.id, teams);
      } else if (type === 'groups' && drawResult.groups) {
        await generateGroupMatches(tournament.id, teams, drawResult.groups);
      }

      toast({ title: 'تم بنجاح! 🎉', description: 'تم إنشاء البطولة وإجراء القرعة' });
      onOpenChange(false);
      resetForm();
      navigate(`${ORGANIZER_BASE}/tournament/${tournament.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="w-6 h-6 text-primary" />
            إنشاء بطولة جديدة
          </DialogTitle>
          <DialogDescription>
            {step === 1 && 'أدخل معلومات البطولة الأساسية'}
            {step === 2 && 'أضف الفرق المشاركة'}
            {step === 3 && 'نتيجة القرعة الذكية'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 my-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                s === step ? 'bg-primary text-primary-foreground' : s < step ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3">
              <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="شعار" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">شعار البطولة</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleLogoSelect} className="sr-only" />
              </label>
            </div>

            <div className="space-y-2">
              <Label>اسم البطولة</Label>
              <Input placeholder="مثال: بطولة الأبطال 2025" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>نظام البطولة</Label>
              <Select value={type} onValueChange={(v) => setType(v as TournamentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="knockout">⚔️ الإقصاء المباشر (Knockout)</SelectItem>
                  <SelectItem value="groups">📊 المجموعات (Groups)</SelectItem>
                </SelectContent>
              </Select>
              {type === 'groups' && (
                <p className="text-xs text-muted-foreground mt-1">
                  النظام المختلط: مرحلة المجموعات لتحديد المتأهلين ثم مرحلة الإقصاء المباشر
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>تاريخ البداية</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>عدد الفرق</Label>
              <Select value={numTeams.toString()} onValueChange={(v) => setNumTeams(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 فرق</SelectItem>
                  <SelectItem value="8">8 فرق</SelectItem>
                  <SelectItem value="16">16 فريق</SelectItem>
                  <SelectItem value="32">32 فريق</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === 'groups' && (
              <div className="space-y-2">
                <Label>عدد المجموعات</Label>
                <Select value={numGroups.toString()} onValueChange={(v) => setNumGroups(parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 مجموعات</SelectItem>
                    <SelectItem value="4">4 مجموعات</SelectItem>
                    <SelectItem value="8">8 مجموعات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم الملعب / المكان</Label>
                <Input placeholder="ملعب المدينة" value={venueName} onChange={(e) => setVenueName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>العنوان</Label>
                <Input placeholder="المدينة، الحي" value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} />
              </div>
            </div>

            {/* Join requests toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div>
                <Label className="text-sm font-medium">استقبال طلبات الانضمام</Label>
                <p className="text-xs text-muted-foreground mt-0.5">السماح للفرق بإرسال طلبات انضمام</p>
              </div>
              <Switch checked={acceptJoinRequests} onCheckedChange={setAcceptJoinRequests} />
            </div>

            {acceptJoinRequests && (
              <div className="space-y-2">
                <Label>الحد الأقصى للفرق</Label>
                <Input type="number" min={2} max={64} value={maxTeams} onChange={(e) => setMaxTeams(parseInt(e.target.value) || 16)} />
              </div>
            )}
          </div>
        )}

        {/* Step 2: Teams */}
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
              <Button onClick={handleAddTeam} variant="outline" size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {teamsList.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {teamsList.map((team, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 rounded-xl border bg-card group hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <span className="font-medium text-sm truncate">{team}</span>
                    </div>
                    <button onClick={() => handleRemoveTeam(index)} className="opacity-0 group-hover:opacity-100 text-destructive p-1 transition-opacity">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-sm text-muted-foreground text-center">
              عدد الفرق المدخلة: <span className="font-bold text-foreground">{teamsList.length}</span> / {numTeams}
            </p>
          </div>
        )}

        {/* Step 3: Draw Result */}
        {step === 3 && drawResult && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-bold text-primary">نتيجة القرعة الذكية</span>
              </div>

              {type === 'knockout' && drawResult.draw && (
                <div className="space-y-2">
                  {(drawResult.draw as string[]).reduce((acc: JSX.Element[], team: string, index: number) => {
                    if (index % 2 === 0) {
                      const opponent = drawResult.draw[index + 1];
                      acc.push(
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                          <span className="font-medium">{team}</span>
                          <span className="text-xs font-bold text-muted-foreground px-2 py-1 rounded bg-muted">VS</span>
                          <span className="font-medium">{opponent}</span>
                        </div>
                      );
                    }
                    return acc;
                  }, [])}
                </div>
              )}

              {type === 'groups' && drawResult.groups && (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(drawResult.groups as Record<string, string[]>).map(([groupName, groupTeams]) => (
                    <div key={groupName} className="p-3 rounded-lg bg-background/50">
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
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>السابق</Button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <Button onClick={handleNext} disabled={aiLoading}>
              {aiLoading ? (
                <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري إجراء القرعة...</>
              ) : step === 2 ? (
                <><Sparkles className="w-4 h-4 ml-2" />إجراء القرعة الذكية</>
              ) : (
                'التالي'
              )}
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
