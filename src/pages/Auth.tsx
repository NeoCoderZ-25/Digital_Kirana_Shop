import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Phone, Lock, User, Mail, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const loginSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = loginSchema.safeParse(loginForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    // Use phone as email format for Supabase auth
    const phoneEmail = `${loginForm.phone}@phone.local`;
    const { error } = await signIn(phoneEmail, loginForm.password);
    setLoading(false);

    if (error) {
      toast({
        title: 'Login failed',
        description: 'Invalid phone number or password',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse(signupForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    // Use phone as primary identifier, store real email in metadata
    const phoneEmail = `${signupForm.phone}@phone.local`;
    const { error } = await signUp(phoneEmail, signupForm.password, {
      username: signupForm.username,
      phone: signupForm.phone,
      real_email: signupForm.email,
    });
    setLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: 'Phone already registered',
          description: 'Please login instead or use a different phone number.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Sign up failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Account created!',
        description: 'Welcome to ShopEase!',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and branding */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl shadow-lg shadow-primary/30 mb-4 rotate-3 hover:rotate-0 transition-transform duration-300">
            <Sparkles className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground font-display">ShopEase</h1>
          <p className="text-muted-foreground mt-1">Your smart shopping companion</p>
        </div>

        {/* Auth card */}
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl shadow-black/10 p-8 animate-slide-in">
          {/* Toggle */}
          <div className="flex bg-muted/50 rounded-2xl p-1 mb-8">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                !isSignUp 
                  ? 'bg-card text-foreground shadow-md' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                isSignUp 
                  ? 'bg-card text-foreground shadow-md' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          {!isSignUp ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-phone" className="text-sm font-medium">Phone Number</Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-medium">+91</span>
                  </div>
                  <Input
                    id="login-phone"
                    type="tel"
                    placeholder="9876543210"
                    value={loginForm.phone}
                    onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="pl-20 h-12 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background/50"
                  />
                </div>
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="pl-11 pr-11 h-12 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5" 
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Sign In
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <button type="button" onClick={() => setIsSignUp(true)} className="text-primary font-medium hover:underline">
                  Create one
                </button>
              </p>
            </form>
          ) : (
            /* Signup Form */
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-username" className="text-sm font-medium">Username</Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <User className="w-4 h-4" />
                  </div>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="johndoe"
                    value={signupForm.username}
                    onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                    className="pl-11 h-12 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background/50"
                  />
                </div>
                {errors.username && <p className="text-xs text-destructive mt-1">{errors.username}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                  </div>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    className="pl-11 h-12 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background/50"
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-phone" className="text-sm font-medium">Phone Number</Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-medium">+91</span>
                  </div>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="9876543210"
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="pl-20 h-12 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background/50"
                  />
                </div>
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      className="h-12 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background/50"
                    />
                  </div>
                  {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm" className="text-sm font-medium">Confirm</Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••"
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                      className="h-12 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background/50"
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showPassword ? 'Hide' : 'Show'} password
                </button>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5" 
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Create Account
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button type="button" onClick={() => setIsSignUp(false)} className="text-primary font-medium hover:underline">
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Auth;
