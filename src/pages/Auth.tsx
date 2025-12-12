import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Phone, Lock, User, Mail, Sparkles, ArrowLeft, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

type AuthMode = 'signin' | 'signup' | 'otp' | 'forgot' | 'reset';

const Auth = () => {
  const { signIn, signUp, signInWithOtp, verifyOtp, resetPasswordWithOtp, updatePassword } = useAuth();
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpTimer, setOtpTimer] = useState(0);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [phone, setPhone] = useState('');
  const [signupForm, setSignupForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    language: language,
  });
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [newPassword, setNewPassword] = useState('');

  // OTP timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const validatePhone = (phone: string) => /^[0-9]{10}$/.test(phone);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    if (pastedData.length === 6) {
      otpRefs.current[5]?.focus();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!validatePhone(loginForm.phone)) {
      setErrors({ phone: t('invalidPhone') });
      return;
    }
    if (loginForm.password.length < 6) {
      setErrors({ password: t('invalidPassword') });
      return;
    }

    setLoading(true);
    const phoneEmail = `${loginForm.phone}@phone.local`;
    const { error } = await signIn(phoneEmail, loginForm.password);
    setLoading(false);

    if (error) {
      toast({
        title: t('error'),
        description: language === 'hi' ? 'गलत फ़ोन नंबर या पासवर्ड' : 'Invalid phone number or password',
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('welcome'),
        description: language === 'hi' ? 'सफलतापूर्वक लॉग इन हो गया।' : 'You have successfully logged in.',
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const fieldErrors: Record<string, string> = {};
    if (signupForm.username.length < 2) fieldErrors.username = t('invalidUsername');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.email)) fieldErrors.email = t('invalidEmail');
    if (!validatePhone(signupForm.phone)) fieldErrors.phone = t('invalidPhone');
    if (signupForm.password.length < 6) fieldErrors.password = t('invalidPassword');
    if (signupForm.password !== signupForm.confirmPassword) fieldErrors.confirmPassword = t('passwordMismatch');

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const phoneEmail = `${signupForm.phone}@phone.local`;
    const { error } = await signUp(phoneEmail, signupForm.password, {
      username: signupForm.username,
      phone: signupForm.phone,
      real_email: signupForm.email,
      preferred_language: signupForm.language,
    });
    setLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: language === 'hi' ? 'फ़ोन पहले से पंजीकृत' : 'Phone already registered',
          description: language === 'hi' ? 'कृपया लॉगिन करें या अलग नंबर का उपयोग करें।' : 'Please login instead or use a different phone number.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('error'),
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      // Save language preference
      setLanguage(signupForm.language as 'en' | 'hi');
      toast({
        title: language === 'hi' ? 'खाता बन गया!' : 'Account created!',
        description: language === 'hi' ? 'ShopEase में आपका स्वागत है!' : 'Welcome to ShopEase!',
      });
    }
  };

  const handleRequestOtp = async () => {
    if (!validatePhone(phone)) {
      setErrors({ phone: t('invalidPhone') });
      return;
    }

    setLoading(true);
    const { error } = await signInWithOtp(phone);
    setLoading(false);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setMode('otp');
      setOtpTimer(30);
      setOtp(['', '', '', '', '', '']);
      toast({
        title: t('otpSent'),
        description: `+91 ${phone.slice(0, 5)}XXXXX`,
      });
    }
  };

  const handleVerifyOtp = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setErrors({ otp: t('invalidOtp') });
      return;
    }

    setLoading(true);
    const { error } = await verifyOtp(phone, otpValue);
    setLoading(false);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('success'),
        description: t('welcome'),
      });
    }
  };

  const handleForgotPassword = async () => {
    if (!validatePhone(phone)) {
      setErrors({ phone: t('invalidPhone') });
      return;
    }

    setLoading(true);
    const { error } = await resetPasswordWithOtp(phone);
    setLoading(false);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('otpSent'),
        description: language === 'hi' ? 'पासवर्ड रीसेट लिंक भेजा गया' : 'Password reset link sent',
      });
      setMode('signin');
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      setErrors({ password: t('invalidPassword') });
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(newPassword);
    setLoading(false);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('success'),
        description: language === 'hi' ? 'पासवर्ड बदल गया' : 'Password updated successfully',
      });
      setMode('signin');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-accent/20 to-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-2xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Language toggle */}
        <div className="absolute -top-2 right-0 flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur border border-border/50 text-sm font-medium hover:bg-card transition-colors"
          >
            <Globe className="w-4 h-4" />
            {language === 'en' ? 'हिंदी' : 'English'}
          </button>
        </div>

        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in pt-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary via-primary to-accent rounded-[2rem] shadow-2xl shadow-primary/30 mb-4 transform hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-12 h-12 text-primary-foreground animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-foreground font-display bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('shopEase')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('smartShopping')}</p>
        </div>

        {/* Auth card */}
        <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl p-8 animate-scale-in">
          
          {/* Back button for OTP/Forgot modes */}
          {(mode === 'otp' || mode === 'forgot' || mode === 'reset') && (
            <button
              onClick={() => setMode('signin')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('back')}
            </button>
          )}

          {/* Mode toggle for signin/signup */}
          {(mode === 'signin' || mode === 'signup') && (
            <div className="flex bg-muted/50 rounded-2xl p-1 mb-8">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  mode === 'signin' 
                    ? 'bg-card text-foreground shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('signIn')}
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  mode === 'signup' 
                    ? 'bg-card text-foreground shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('signUp')}
              </button>
            </div>
          )}

          {/* Sign In Form */}
          {mode === 'signin' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-phone" className="text-sm font-medium">{t('phone')}</Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-semibold">+91</span>
                  </div>
                  <Input
                    id="login-phone"
                    type="tel"
                    placeholder="9876543210"
                    value={loginForm.phone}
                    onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="pl-20 h-14 rounded-2xl border-2 border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all bg-background/50 text-lg"
                  />
                </div>
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium">{t('password')}</Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="pl-12 pr-12 h-14 rounded-2xl border-2 border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all bg-background/50 text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <button
                type="button"
                onClick={() => { setPhone(loginForm.phone); setMode('forgot'); }}
                className="text-sm text-primary hover:underline font-medium"
              >
                {t('forgotPassword')}
              </button>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-xl shadow-primary/25 transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5" 
                disabled={loading}
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : t('signIn')}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t('dontHaveAccount')}{' '}
                <button type="button" onClick={() => setMode('signup')} className="text-primary font-semibold hover:underline">
                  {t('createOne')}
                </button>
              </p>
            </form>
          )}

          {/* Sign Up Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Language Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('selectLanguage')}</Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setSignupForm({ ...signupForm, language: 'en' }); setLanguage('en'); }}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                      signupForm.language === 'en'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSignupForm({ ...signupForm, language: 'hi' }); setLanguage('hi'); }}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                      signupForm.language === 'hi'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    🇮🇳 हिंदी
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-username" className="text-sm font-medium">{t('username')}</Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="rahul_sharma"
                    value={signupForm.username}
                    onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                    className="pl-12 h-12 rounded-xl border-2 border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all bg-background/50"
                  />
                </div>
                {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-sm font-medium">{t('email')}</Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="rahul@example.com"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    className="pl-12 h-12 rounded-xl border-2 border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all bg-background/50"
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-phone" className="text-sm font-medium">{t('phone')}</Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-semibold">+91</span>
                  </div>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="9876543210"
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="pl-20 h-12 rounded-xl border-2 border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all bg-background/50"
                  />
                </div>
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium">{t('password')}</Label>
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    className="h-12 rounded-xl border-2 border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all bg-background/50"
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm" className="text-sm font-medium">{t('confirmPassword')}</Label>
                  <Input
                    id="signup-confirm"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••"
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                    className="h-12 rounded-xl border-2 border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all bg-background/50"
                  />
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showPassword ? 'Hide' : 'Show'} password
              </button>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-xl shadow-primary/25 transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5" 
                disabled={loading}
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : t('createAccount')}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t('alreadyHaveAccount')}{' '}
                <button type="button" onClick={() => setMode('signin')} className="text-primary font-semibold hover:underline">
                  {t('signIn')}
                </button>
              </p>
            </form>
          )}

          {/* OTP Verification */}
          {mode === 'otp' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold mb-2">{t('verifyOtp')}</h2>
                <p className="text-muted-foreground">
                  {t('enterOtp')}
                  <br />
                  <span className="font-semibold text-foreground">+91 {phone.slice(0, 5)}XXXXX</span>
                </p>
              </div>

              <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => otpRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all bg-background"
                  />
                ))}
              </div>
              {errors.otp && <p className="text-xs text-destructive text-center">{errors.otp}</p>}

              <Button 
                onClick={handleVerifyOtp}
                className="w-full h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-primary to-primary/80 shadow-xl shadow-primary/25" 
                disabled={loading || otp.join('').length !== 6}
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : t('verifyAndLogin')}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {otpTimer > 0 ? (
                  <span>{t('resendOtp')} ({otpTimer}s)</span>
                ) : (
                  <button onClick={handleRequestOtp} className="text-primary font-semibold hover:underline">
                    {t('resendOtp')}
                  </button>
                )}
              </p>
            </div>
          )}

          {/* Forgot Password */}
          {mode === 'forgot' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold mb-2">{t('forgotPassword')}</h2>
                <p className="text-muted-foreground">
                  {language === 'hi' ? 'पासवर्ड रीसेट लिंक के लिए अपना फ़ोन नंबर दर्ज करें' : 'Enter your phone number to receive a password reset link'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="forgot-phone" className="text-sm font-medium">{t('phone')}</Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-semibold">+91</span>
                  </div>
                  <Input
                    id="forgot-phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="pl-20 h-14 rounded-2xl border-2 border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all bg-background/50 text-lg"
                  />
                </div>
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>

              <Button 
                onClick={handleForgotPassword}
                className="w-full h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-primary to-primary/80 shadow-xl shadow-primary/25" 
                disabled={loading}
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : t('resetPassword')}
              </Button>
            </div>
          )}

          {/* Reset Password */}
          {mode === 'reset' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold mb-2">{t('newPassword')}</h2>
                <p className="text-muted-foreground">
                  {language === 'hi' ? 'अपना नया पासवर्ड दर्ज करें' : 'Enter your new password'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-medium">{t('newPassword')}</Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-12 pr-12 h-14 rounded-2xl border-2 border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all bg-background/50 text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <Button 
                onClick={handleResetPassword}
                className="w-full h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-primary to-primary/80 shadow-xl shadow-primary/25" 
                disabled={loading}
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : t('resetPassword')}
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {t('termsAndPrivacy')}
        </p>
      </div>
    </div>
  );
};

export default Auth;
