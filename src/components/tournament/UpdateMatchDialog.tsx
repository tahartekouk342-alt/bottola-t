import { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import type { MatchWithTeams } from '@/hooks/useTournamentDetails';

interface UpdateMatchDialogProps {
  match: MatchWithTeams | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (matchId: string, homeScore: number, awayScore: number) => Promise<boolean>;
}

export function UpdateMatchDialog({
  match,
  open,
  onOpenChange,
  onUpdate,
}: UpdateMatchDialogProps) {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (match) {
      setHomeScore(match.home_score || 0);
      setAwayScore(match.away_score || 0);
    }
  }, [match]);

  const handleSubmit = async () => {
    if (!match) return;

    setLoading(true);
    try {
      const success = await onUpdate(match.id, homeScore, awayScore);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!match) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تحديث نتيجة المباراة</DialogTitle>
          <DialogDescription>
            أدخل النتيجة النهائية للمباراة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Teams Display */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <div className="text-lg font-bold mb-2">
                {match.home_team?.name || 'فريق 1'}
              </div>
              <div className="space-y-2">
                <Label htmlFor="homeScore" className="sr-only">
                  نتيجة الفريق الأول
                </Label>
                <Input
                  id="homeScore"
                  type="number"
                  min={0}
                  value={homeScore}
                  onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                  className="text-center text-2xl font-display h-16"
                />
              </div>
            </div>

            <div className="text-2xl font-bold text-muted-foreground">VS</div>

            <div className="flex-1 text-center">
              <div className="text-lg font-bold mb-2">
                {match.away_team?.name || 'فريق 2'}
              </div>
              <div className="space-y-2">
                <Label htmlFor="awayScore" className="sr-only">
                  نتيجة الفريق الثاني
                </Label>
                <Input
                  id="awayScore"
                  type="number"
                  min={0}
                  value={awayScore}
                  onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                  className="text-center text-2xl font-display h-16"
                />
              </div>
            </div>
          </div>

          {/* Winner Preview */}
          {homeScore !== awayScore && (
            <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-sm text-muted-foreground">الفائز: </span>
              <span className="font-bold text-primary">
                {homeScore > awayScore
                  ? match.home_team?.name
                  : match.away_team?.name}
              </span>
            </div>
          )}

          {homeScore === awayScore && (
            <div className="text-center p-3 rounded-lg bg-muted">
              <span className="text-sm text-muted-foreground">
                نتيجة التعادل غير مسموحة في نظام خروج المغلوب
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || homeScore === awayScore}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ النتيجة'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
