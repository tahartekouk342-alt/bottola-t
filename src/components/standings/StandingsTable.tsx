import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TeamStanding {
  position: number;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: ('W' | 'D' | 'L')[];
}

interface StandingsTableProps {
  standings: TeamStanding[];
  highlightPositions?: {
    promotion?: number[];
    relegation?: number[];
  };
}

export function StandingsTable({ standings, highlightPositions }: StandingsTableProps) {
  const getPositionStyle = (position: number) => {
    if (highlightPositions?.promotion?.includes(position)) {
      return 'border-r-2 border-r-primary';
    }
    if (highlightPositions?.relegation?.includes(position)) {
      return 'border-r-2 border-r-destructive';
    }
    return '';
  };

  const getFormBadge = (result: 'W' | 'D' | 'L') => {
    const styles = {
      W: 'bg-primary text-primary-foreground',
      D: 'bg-muted text-muted-foreground',
      L: 'bg-destructive text-destructive-foreground',
    };
    const labels = { W: 'ف', D: 'ت', L: 'خ' };
    
    return (
      <span className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
        styles[result]
      )}>
        {labels[result]}
      </span>
    );
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-group-header hover:bg-group-header">
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>الفريق</TableHead>
            <TableHead className="text-center w-10">لعب</TableHead>
            <TableHead className="text-center w-10 hidden sm:table-cell">ف</TableHead>
            <TableHead className="text-center w-10 hidden sm:table-cell">ت</TableHead>
            <TableHead className="text-center w-10 hidden sm:table-cell">خ</TableHead>
            <TableHead className="text-center w-14 hidden md:table-cell">+/-</TableHead>
            <TableHead className="text-center w-12 font-bold">نقاط</TableHead>
            <TableHead className="text-center hidden lg:table-cell">آخر 5</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((team, index) => (
            <TableRow
              key={team.name}
              className={cn(
                getPositionStyle(team.position),
                index % 2 === 1 && "bg-standings-row-alt"
              )}
            >
              <TableCell className="text-center font-bold text-muted-foreground">
                {team.position}
              </TableCell>
              <TableCell className="font-medium">{team.name}</TableCell>
              <TableCell className="text-center text-muted-foreground">{team.played}</TableCell>
              <TableCell className="text-center text-muted-foreground hidden sm:table-cell">{team.won}</TableCell>
              <TableCell className="text-center text-muted-foreground hidden sm:table-cell">{team.drawn}</TableCell>
              <TableCell className="text-center text-muted-foreground hidden sm:table-cell">{team.lost}</TableCell>
              <TableCell className={cn(
                "text-center hidden md:table-cell",
                team.goalDifference > 0 && "text-primary",
                team.goalDifference < 0 && "text-destructive"
              )}>
                {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
              </TableCell>
              <TableCell className="text-center font-display text-lg font-bold text-primary">
                {team.points}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex items-center justify-center gap-1">
                  {team.form?.map((result, i) => (
                    <span key={i}>{getFormBadge(result)}</span>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
