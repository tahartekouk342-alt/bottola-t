import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trophy, Mail, Lock, User, Eye, EyeOff, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
});

const signupSchema = z.object({
  displayName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword']
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function Auth() {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('viewer');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.role === 'organizer') {
              navigate('/tournaments');
            } else {
              navigate('/following');
            }
          });
      }
    });
  }, [navigate]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' }
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    const result = await signIn(data.email, data.password);
    setIsLoading(false);

    if (!result.error && result.user) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', result.user.id)
        .single();

      if (roleData?.role === 'organizer') {
        navigate('/tournaments');
      } else {
        navigate('/following');
      }
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    const result = await signUp(data.email, data.password, data.displayName, selectedRole);
    setIsLoading(false);

    if (!result.error) {
      signupForm.reset();
    }
  };

  return (
    <div className="page-container flex items-center justify-center p-4">
      {/* Background imagery */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/5" />
      
      <Card className="w-full max-w-md relative z-10 sports-card border-white/5 bg-card/40 backdrop-blur-2xl shadow-2xl">
        <CardHeader className="text-center space-y-6 pt-10 pb-6">
          <div className="mx-auto w-20 h-20 rounded-[1.5rem] gradient-primary flex items-center justify-center glow-primary shadow-2xl rotate-3 transition-transform hover:rotate-0 duration-500">
            <Trophy className="w-10 h-10 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-black font-display tracking-tighter uppercase">Bottola</CardTitle>
            <CardDescription className="text-xs font-black text-primary uppercase tracking-[0.3em]">بوابة المحترفين</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-8 pb-10">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-10 p-1 bg-white/5 rounded-2xl border border-white/5">
              <TabsTrigger value="login" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">دخول</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">تسجيل</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">البريد الإلكتروني</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                            <Input 
                              {...field} 
                              type="email" 
                              placeholder="example@email.com"
                              className="pr-12 h-14 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all font-bold"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">كلمة المرور</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                            <Input 
                              {...field} 
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="pr-12 pl-12 h-14 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full h-14 gradient-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    disabled={isLoading}
                  >
                    {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="signup">
              <div className="mb-8 p-4 rounded-2xl bg-white/5 border border-white/5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 block text-center">اختر نوع الحساب</Label>
                <RadioGroup 
                  defaultValue="viewer" 
                  className="grid grid-cols-2 gap-4"
                  onValueChange={(v) => setSelectedRole(v as UserRole)}
                >
                  <div className="relative">
                    <RadioGroupItem value="viewer" id="viewer" className="peer sr-only" />
                    <Label
                      htmlFor="viewer"
                      className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-transparent bg-background/50 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                    >
                      <Users className="w-6 h-6 mb-2 text-primary" />
                      <span className="text-xs font-black">مشاهد</span>
                    </Label>
                  </div>
                  <div className="relative">
                    <RadioGroupItem value="organizer" id="organizer" className="peer sr-only" />
                    <Label
                      htmlFor="organizer"
                      className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-transparent bg-background/50 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                    >
                      <Shield className="w-6 h-6 mb-2 text-primary" />
                      <span className="text-xs font-black">منظم</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-6">
                  <FormField
                    control={signupForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">الاسم الكامل</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                            <Input 
                              {...field} 
                              placeholder="أحمد محمد"
                              className="pr-12 h-14 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all font-bold"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">البريد الإلكتروني</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                            <Input 
                              {...field} 
                              type="email" 
                              placeholder="example@email.com"
                              className="pr-12 h-14 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all font-bold"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">كلمة المرور</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                            <Input 
                              {...field} 
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="pr-12 pl-12 h-14 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 focus:border-primary/30 transition-all font-bold"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full h-14 gradient-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    disabled={isLoading}
                  >
                    {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب جديد'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
