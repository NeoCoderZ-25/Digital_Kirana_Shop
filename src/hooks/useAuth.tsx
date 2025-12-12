import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: { username?: string; phone?: string; real_email?: string; preferred_language?: string }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithOtp: (phone: string) => Promise<{ error: Error | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: Error | null }>;
  resetPasswordWithOtp: (phone: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: { username?: string; phone?: string; real_email?: string; preferred_language?: string }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/`
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  // OTP-based sign in - sends OTP to phone
  const signInWithOtp = async (phone: string) => {
    // Note: This requires Supabase Phone Auth to be configured with an SMS provider
    // For demo purposes, we'll simulate OTP by using email OTP with phone@phone.local format
    const phoneEmail = `${phone}@phone.local`;
    const { error } = await supabase.auth.signInWithOtp({
      email: phoneEmail,
      options: {
        shouldCreateUser: false // Only allow existing users
      }
    });
    return { error };
  };

  // Verify OTP token
  const verifyOtp = async (phone: string, token: string) => {
    const phoneEmail = `${phone}@phone.local`;
    const { error } = await supabase.auth.verifyOtp({
      email: phoneEmail,
      token,
      type: 'email'
    });
    return { error };
  };

  // Reset password - send OTP to phone
  const resetPasswordWithOtp = async (phone: string) => {
    const phoneEmail = `${phone}@phone.local`;
    const { error } = await supabase.auth.resetPasswordForEmail(phoneEmail, {
      redirectTo: `${window.location.origin}/auth?mode=reset`
    });
    return { error };
  };

  // Update password after reset
  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signUp, 
      signIn, 
      signInWithOtp, 
      verifyOtp, 
      resetPasswordWithOtp, 
      updatePassword, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
