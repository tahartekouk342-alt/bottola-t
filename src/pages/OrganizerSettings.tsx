import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, User, Lock, Camera, Save, Loader2, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ORGANIZER_BASE } from '@/lib/constants';

export default function OrganizerSettings() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // PIN fields
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);
  const [hasExistingPin, setHasExistingPin] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`${ORGANIZER_BASE}/auth?tab=login`);
      return;
    }
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url);
    }
    if (user) {
      supabase
        .from('profiles')
        .select('pin_hash')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          setHasExistingPin(!!data?.pin_hash);
        });
    }
  }, [profile, user, authLoading, navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
      toast({ title: 'تم رفع الصورة بنجاح' });
    } catch (error: any) {
      toast({ title: 'خطأ في رفع الصورة', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName, bio, avatar_url: avatarUrl })
        .eq('user_id', user.id);
      if (error) throw error;
      toast({ title: 'تم حفظ الإعدادات بنجاح ✅' });
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePin = async () => {
    if (!user) return;
    if (newPin.length < 4) {
      toast({ title: 'رمز PIN يجب أن يكون 4 أرقام على الأقل', variant: 'destructive' });
      return;
    }
    if (newPin !== confirmPin) {
      toast({ title: 'رموز PIN غير متطابقة', variant: 'destructive' });
      return;
    }

    if (hasExistingPin) {
      const { data } = await supabase.from('profiles').select('pin_hash').eq('user_id', user.id).single();
      if (data?.pin_hash !== btoa(currentPin)) {
        toast({ title: 'رمز PIN الحالي غير صحيح', variant: 'destructive' });
        return;
      }
    }

    setSavingPin(true);
    try {
      const { error } = await supabase.from('profiles').update({ pin_hash: btoa(newPin) }).eq('user_id', user.id);
      if (error) throw error;
      toast({ title: 'تم تعيين رمز PIN بنجاح ✅' });
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setHasExistingPin(true);
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setSavingPin(false);
    }
  };

  const handleRemovePin = async () => {
    if (!user) return;

    // Verify current PIN first
    const { data } = await supabase.from('profiles').select('pin_hash').eq('user_id', user.id).single();
    if (data?.pin_hash !== btoa(currentPin)) {
      toast({ title: 'رمز PIN الحالي غير صحيح', variant: 'destructive' });
      return;
    }

    setSavingPin(true);
    try {
      const { error } = await supabase.from('profiles').update({ pin_hash: null }).eq('user_id', user.id);
      if (error) throw error;
      toast({ title: 'تم إلغاء رمز PIN ✅' });
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setHasExistingPin(false);
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setSavingPin(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(`${ORGANIZER_BASE}/dashboard`)}>
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة للوحة التحكم
        </Button>

        <h1 className="font-display text-3xl font-bold mb-8">الإعدادات</h1>

        {/* Profile Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" />الملف الشخصي</CardTitle>
            <CardDescription>تحديث بيانات حسابك وصورتك الشخصية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-20 h-20 ring-4 ring-primary/20">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {displayName?.charAt(0) || 'م'}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full gradient-primary flex items-center justify-center cursor-pointer shadow-lg">
                  <Camera className="w-4 h-4 text-primary-foreground" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="sr-only" />
                </label>
              </div>
              <div>
                <p className="font-medium">{uploading ? 'جاري الرفع...' : 'صورة الملف الشخصي'}</p>
                <p className="text-sm text-muted-foreground">اضغط على أيقونة الكاميرا لتغيير الصورة</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>اسم العرض</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="اسمك كمنظم" />
            </div>

            <div className="space-y-2">
              <Label>نبذة عنك</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="اكتب نبذة مختصرة عنك..." rows={3} />
            </div>

            <Button onClick={handleSaveProfile} disabled={saving} className="gradient-primary text-primary-foreground">
              {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
              حفظ الملف الشخصي
            </Button>
          </CardContent>
        </Card>

        {/* PIN Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5" />رمز PIN للأمان</CardTitle>
            <CardDescription>
              {hasExistingPin
                ? 'يمكنك تغيير أو إلغاء رمز PIN الخاص بك'
                : 'قم بتعيين رمز PIN لحماية لوحة التحكم عند فتح التطبيق'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasExistingPin && (
              <div className="space-y-2">
                <Label>رمز PIN الحالي</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="أدخل رمز PIN الحالي"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>{hasExistingPin ? 'رمز PIN الجديد' : 'رمز PIN'}</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="أدخل 4-6 أرقام"
              />
            </div>

            <div className="space-y-2">
              <Label>تأكيد رمز PIN</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="أعد إدخال رمز PIN"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSavePin} disabled={savingPin} className="gradient-primary text-primary-foreground">
                {savingPin ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Lock className="w-4 h-4 ml-2" />}
                {hasExistingPin ? 'تغيير رمز PIN' : 'تعيين رمز PIN'}
              </Button>

              {hasExistingPin && (
                <Button onClick={handleRemovePin} disabled={savingPin || !currentPin} variant="destructive">
                  <ShieldOff className="w-4 h-4 ml-2" />
                  إلغاء PIN
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
