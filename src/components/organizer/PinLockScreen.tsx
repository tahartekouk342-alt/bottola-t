import { useState } from 'react';
import { Trophy, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PinLockScreenProps {
  userId: string;
  onSuccess: () => void;
}

export function PinLockScreen({ userId, onSuccess }: PinLockScreenProps) {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await supabase
        .from('profiles')
        .select('pin_hash')
        .eq('user_id', userId)
        .single();

      // Simple hash comparison (in production, use bcrypt via edge function)
      const pinHash = btoa(pin);
      if (data?.pin_hash === pinHash) {
        onSuccess();
      } else {
        toast({
          title: 'رمز PIN غير صحيح',
          description: 'يرجى إدخال رمز PIN الصحيح',
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء التحقق',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      <Card className="w-full max-w-sm relative z-10 border-border/50 bg-card/80 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center glow-primary">
            <Lock className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-xl font-display">أدخل رمز PIN</CardTitle>
            <CardDescription>أدخل رمز PIN الخاص بك للوصول للوحة التحكم</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="text-center text-2xl tracking-[0.5em] font-mono"
              autoFocus
            />
            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground font-semibold"
              disabled={isLoading || pin.length < 4}
            >
              {isLoading ? 'جاري التحقق...' : 'تأكيد'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
