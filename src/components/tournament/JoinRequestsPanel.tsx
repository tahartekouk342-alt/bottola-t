import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, Loader2, Users, Clock } from 'lucide-react';

interface JoinRequest {
  id: string;
  tournament_id: string;
  team_name: string;
  team_logo_url: string | null;
  player_names: string[];
  player_photos: string[];
  status: string;
  created_at: string;
}

interface JoinRequestsPanelProps {
  tournamentId: string;
}

export function JoinRequestsPanel({ tournamentId }: JoinRequestsPanelProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('join_requests')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false });

    if (!error) setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel(`join-requests-${tournamentId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'join_requests',
        filter: `tournament_id=eq.${tournamentId}`,
      }, () => fetchRequests())
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [tournamentId]);

  const handleAccept = async (request: JoinRequest) => {
    setProcessing(request.id);
    try {
      // Add team to tournament
      const { error: teamError } = await supabase.from('teams').insert({
        tournament_id: tournamentId,
        name: request.team_name,
        logo_url: request.team_logo_url,
      });

      if (teamError) throw teamError;

      // Update request status
      await supabase.from('join_requests').update({ status: 'accepted' }).eq('id', request.id);
      toast({ title: 'تم قبول الفريق ✅', description: `تم إضافة ${request.team_name}` });
      fetchRequests();
    } catch (error) {
      toast({ title: 'خطأ', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessing(requestId);
    try {
      await supabase.from('join_requests').update({ status: 'rejected' }).eq('id', requestId);
      toast({ title: 'تم رفض الطلب' });
      fetchRequests();
    } catch {
      toast({ title: 'خطأ', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-bold mb-2">لا توجد طلبات انضمام</h3>
        <p className="text-muted-foreground">سيظهر هنا طلبات الفرق الراغبة بالانضمام</p>
      </div>
    );
  }

  const statusConfig = {
    pending: { label: 'قيد المراجعة', variant: 'secondary' as const },
    accepted: { label: 'مقبول', variant: 'default' as const },
    rejected: { label: 'مرفوض', variant: 'destructive' as const },
  };

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={request.team_logo_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {request.team_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold">{request.team_name}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Clock className="w-3 h-3" />
                    {new Date(request.created_at).toLocaleDateString('ar-SA')}
                    {request.player_names?.length > 0 && (
                      <span>• {request.player_names.length} لاعب</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={statusConfig[request.status as keyof typeof statusConfig]?.variant || 'secondary'}>
                  {statusConfig[request.status as keyof typeof statusConfig]?.label || request.status}
                </Badge>
                {request.status === 'pending' && (
                  <>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleReject(request.id)} disabled={processing === request.id}>
                      <X className="w-4 h-4" />
                    </Button>
                    <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => handleAccept(request)} disabled={processing === request.id}>
                      {processing === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Player Names */}
            {request.player_names?.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-1">اللاعبون:</p>
                <div className="flex flex-wrap gap-1.5">
                  {request.player_names.map((name, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-md bg-muted">{name}</span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
