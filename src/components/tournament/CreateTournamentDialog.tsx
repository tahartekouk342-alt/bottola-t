import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Trophy } from 'lucide-react';
import { useTournaments } from '@/hooks/useTournaments';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type TournamentType = Database['public']['Enums']['tournament_type'];

interface CreateTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTournamentDialog({
  open,
  onOpenChange,
}: CreateTournamentDialogProps) {
  const navigate = useNavigate();
  const { createTournament, addTeams, performAIDraw, generateKnockoutMatches } =
    useTournaments();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Step 1: Basic info
  const [name, setName] = useState('');
  const [type, setType] = useState<TournamentType>('knockout');
  const [startDate, setStartDate] = useState('');
  const [numTeams, setNumTeams] = useState(8);
  const [numGroups, setNumGroups] = useState(4);

  // Step 2: Teams
  const [teamsText, setTeamsText] = useState('');

  // Step 3: Draw result
  const [drawResult, setDrawResult] = useState<any>(null);
  const [tournamentId, setTournamentId] = useState<string | null>(null);

  const resetForm = () => {
    setStep(1);
    setName('');
    setType('knockout');
    setStartDate('');
    setNumTeams(8);
    setNumGroups(4);
    setTeamsText('');
    setDrawResult(null);
    setTournamentId(null);
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!name.trim()) {
        toast({
          title: 'خطأ',
          description: 'يرجى إدخال اسم البطولة',
          variant: 'destructive',
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const teamsList = teamsText
        .split('\n')
        .map((t) => t.trim())
        .filter((t) => t);

      if (teamsList.length < 2) {
        toast({
          title: 'خطأ',
          description: 'يرجى إدخال فريقين على الأقل',
          variant: 'destructive',
        });
        return;
      }

      if (type === 'knockout' && teamsList.length !== numTeams) {
        toast({
          title: 'خطأ',
          description: `يجب إدخال ${numTeams} فريق`,
          variant: 'destructive',
        });
        return;
      }

      // Perform AI draw
      setAiLoading(true);
      try {
        const result = await performAIDraw(teamsList, type, numGroups);
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
      // Create tournament
      const tournament = await createTournament({
        name,
        type,
        startDate,
        numTeams,
        numGroups,
      });

      if (!tournament) return;
      setTournamentId(tournament.id);

      // Get ordered teams from draw
      const orderedTeams =
        type === 'groups'
          ? Object.values(drawResult.groups || {}).flat()
          : drawResult.draw || [];

      // Add teams
      const teams = await addTeams(tournament.id, orderedTeams as string[]);
      if (!teams) return;

      // Generate matches for knockout
      if (type === 'knockout') {
        await generateKnockoutMatches(tournament.id, teams);
      }

      toast({
        title: 'تم بنجاح! 🎉',
        description: 'تم إنشاء البطولة وإجراء القرعة',
      });

      onOpenChange(false);
      resetForm();
      navigate(`/tournament/${tournament.id}`);
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
            {step === 2 && 'أدخل أسماء الفرق المشاركة'}
            {step === 3 && 'نتيجة القرعة الذكية'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 my-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                s === step
                  ? 'bg-primary text-primary-foreground'
                  : s < step
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم البطولة</Label>
              <Input
                id="name"
                placeholder="مثال: بطولة الأبطال 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">نظام البطولة</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as TournamentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="knockout">خروج المغلوب</SelectItem>
                  <SelectItem value="league">دوري</SelectItem>
                  <SelectItem value="groups">مجموعات + خروج المغلوب</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">تاريخ البداية</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numTeams">عدد الفرق</Label>
              <Select
                value={numTeams.toString()}
                onValueChange={(v) => setNumTeams(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
                <Label htmlFor="numGroups">عدد المجموعات</Label>
                <Select
                  value={numGroups.toString()}
                  onValueChange={(v) => setNumGroups(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 مجموعات</SelectItem>
                    <SelectItem value="4">4 مجموعات</SelectItem>
                    <SelectItem value="8">8 مجموعات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Teams */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teams">
                أسماء الفرق (فريق واحد في كل سطر)
              </Label>
              <Textarea
                id="teams"
                placeholder={`النجوم\nالصقور\nالأسود\nالنمور\n...`}
                value={teamsText}
                onChange={(e) => setTeamsText(e.target.value)}
                rows={10}
                className="font-mono"
              />
              <p className="text-sm text-muted-foreground">
                عدد الفرق المدخلة:{' '}
                {teamsText.split('\n').filter((t) => t.trim()).length} /{' '}
                {numTeams}
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Draw Result */}
        {step === 3 && drawResult && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-bold text-primary">نتيجة القرعة الذكية</span>
              </div>

              {type === 'knockout' && drawResult.draw && (
                <div className="space-y-2">
                  {(drawResult.draw as string[]).reduce(
                    (acc: JSX.Element[], team: string, index: number) => {
                      if (index % 2 === 0) {
                        const opponent = drawResult.draw[index + 1];
                        acc.push(
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-md bg-background/50"
                          >
                            <span className="font-medium">{team}</span>
                            <span className="text-muted-foreground">VS</span>
                            <span className="font-medium">{opponent}</span>
                          </div>
                        );
                      }
                      return acc;
                    },
                    []
                  )}
                </div>
              )}

              {type === 'groups' && drawResult.groups && (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(
                    drawResult.groups as Record<string, string[]>
                  ).map(([groupName, groupTeams]) => (
                    <div
                      key={groupName}
                      className="p-3 rounded-md bg-background/50"
                    >
                      <h4 className="font-bold text-primary mb-2">
                        المجموعة {groupName}
                      </h4>
                      <ul className="space-y-1">
                        {groupTeams.map((team, i) => (
                          <li key={i} className="text-sm">
                            {i + 1}. {team}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {type === 'league' && drawResult.draw && (
                <div className="space-y-1">
                  {(drawResult.draw as string[]).map(
                    (team: string, index: number) => (
                      <div
                        key={index}
                        className="p-2 rounded-md bg-background/50"
                      >
                        {index + 1}. {team}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              السابق
            </Button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <Button onClick={handleNext} disabled={aiLoading}>
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري إجراء القرعة...
                </>
              ) : (
                <>
                  {step === 2 ? (
                    <>
                      <Sparkles className="w-4 h-4 ml-2" />
                      إجراء القرعة الذكية
                    </>
                  ) : (
                    'التالي'
                  )}
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4 ml-2" />
                  إنشاء البطولة
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
