import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Camera, Save, Loader2, Moon, Sun, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/components/theme/ThemeProvider';
import { supabase } from '@/integrations/supabase/client';
import { setLanguage } from '@/i18n';

export default function ViewerSettings() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { resolvedTheme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/auth?role=viewer'); return; }
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile, user, authLoading, navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      const { error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
      toast({ title: t('common.success') });
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } finally { setUploading(false); }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ display_name: displayName, bio, avatar_url: avatarUrl }).eq('user_id', user.id);
      if (error) throw error;
      toast({ title: t('common.success') });
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">{t('settings.title')}</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" />{t('settings.profile')}</CardTitle>
          <CardDescription>{t('settings.profileDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-20 h-20 ring-4 ring-primary/20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{displayName?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -end-1 w-8 h-8 rounded-full gradient-primary flex items-center justify-center cursor-pointer shadow-lg">
                <Camera className="w-4 h-4 text-primary-foreground" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="sr-only" />
              </label>
            </div>
            <div>
              <p className="font-medium">{uploading ? t('settings.uploadingPhoto') : t('settings.profilePhoto')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.changePhotoHint')}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('settings.displayName')}</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('settings.bio')}</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t('settings.bioPlaceholder')} rows={3} />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} className="gradient-primary text-primary-foreground">
            {saving ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
            {t('settings.saveProfile')}
          </Button>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Languages className="w-5 h-5" />{t('settings.language')}</CardTitle>
          <CardDescription>{t('settings.languageDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Button variant={i18n.language === 'ar' ? 'default' : 'outline'} onClick={() => setLanguage('ar')} className={i18n.language === 'ar' ? 'gradient-primary text-primary-foreground' : ''}>
            🇸🇦 العربية
          </Button>
          <Button variant={i18n.language === 'fr' ? 'default' : 'outline'} onClick={() => setLanguage('fr')} className={i18n.language === 'fr' ? 'gradient-primary text-primary-foreground' : ''}>
            🇫🇷 Français
          </Button>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {resolvedTheme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            {t('settings.appearance')}
          </CardTitle>
          <CardDescription>{t('settings.appearanceDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className="w-full">
            {resolvedTheme === 'dark' ? <Sun className="w-5 h-5 me-2" /> : <Moon className="w-5 h-5 me-2" />}
            {resolvedTheme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
