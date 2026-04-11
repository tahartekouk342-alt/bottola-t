import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Star } from 'lucide-react';
import type { MatchWithTeams } from '@/hooks/useTournamentDetails';

interface UpdateMatchDialogProps {
  match: MatchWithTeams | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (matchId: string, homeScore: number, awayScore: number, manOfMatch?: string) => Promise<boolean>;
  tournamentType?: string;
}

export function UpdateMatchDialog({ match, open, onOpenChange, onUpdate, tournamentType }: UpdateMatchDialogProps) {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [manOfMatch, setManOfMatch] = useState('');
  const [loading, setLoading] = useState(false);

  const isKnockout = !match?.group_name && tournamentType !== 'league';

  useEffect(() => {
    if (match) {
      setHomeScore(match.home_score || 0);
      setAwayScore(match.away_score || 0);
      setManOfMatch((match as any).man_of_match_name || '');
    }
  }, [match]);

  const handleSubmit = async () => {
    if (!match) return;
    setLoading(true);
    try {
      const success = await onUpdate(match.id, homeScore, awayScore, manOfMatch || undefined);
      if (success) onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!match) return null;

  const drawNotAllowed = isKnockout && homeScore === awayScore;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تحديث نتيجة المباراة</DialogTitle>
          <DialogDescription>أدخل النتيجة النهائية للمباراة</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <div className="text-lg font-bold mb-2">{match.home_team?.name || 'فريق 1'}</div>
              <Label htmlFor="homeScore" className="sr-only">نتيجة الفريق الأول</Label>
              <Input id="homeScore" type="number" min={0} value={homeScore}
                onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                className="text-center text-2xl font-display h-16" />
            </div>
            <div className="text-2xl font-bold text-muted-foreground">VS</div>
            <div className="flex-1 text-center">
              <div className="text-lg font-bold mb-2">{match.away_team?.name || 'فريق 2'}</div>
              <Label htmlFor="awayScore" className="sr-only">نتيجة الفريق الثاني</Label>
              <Input id="awayScore" type="number" min={0} value={awayScore}
                onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                className="text-center text-2xl font-display h-16" />
            </div>
          </div>

          {homeScore !== awayScore && (
            <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-sm text-muted-foreground">الفائز: </span>
              <span className="font-bold text-primary">
                {homeScore > awayScore ? match.home_team?.name : match.away_team?.name}
              </span>
            </div>
          )}

          {drawNotAllowed && (
            <div className="text-center p-3 rounded-lg bg-muted">
              <span className="text-sm text-muted-foreground">نتيجة التعادل غير مسموحة في نظام خروج المغلوب</span>
            </div>
          )}

          {/* Man of the Match */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 text-yellow-500" /> رجل المباراة (اختياري)
            </Label>
            <Input placeholder="اسم اللاعب" value={manOfMatch} onChange={(e) => setManOfMatch(e.target.value)} />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">إلغاء</Button>
            <Button onClick={handleSubmit} disabled={loading || drawNotAllowed} className="flex-1">
              {loading ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري الحفظ...</> : 'حفظ النتيجة'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
