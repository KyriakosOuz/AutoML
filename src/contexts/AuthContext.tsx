
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (provider: 'google' | 'github' | 'email', email?: string, password?: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export the getAuthToken function that returns a string immediately
export const getAuthToken = (): string => {
  // This will only work client-side
  if (typeof window !== 'undefined') {
    // Get from localStorage (for immediate access)
    return localStorage.getItem('authToken') || '';
  }
  
  return '';
};

// Helper function to get captcha token (supports both reCAPTCHA and hCaptcha)
const getCaptchaToken = (): string | undefined => {
  if (typeof window !== 'undefined') {
    try {
      // Try to get hCaptcha token first
      if (window.hcaptcha) {
        const token = window.hcaptcha.getResponse();
        if (token) return token;
      }
      
      // Fall back to reCAPTCHA if hCaptcha is not available or token is empty
      if (window.grecaptcha) {
        const token = window.grecaptcha.getResponse();
        if (token) return token;
      }
      
      // If we reach here, no valid token was found
      toast({
        title: 'CAPTCHA Required',
        description: 'Please complete the CAPTCHA verification.',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Error getting CAPTCHA token:', error);
    }
  }
  return undefined;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Store the token in localStorage for immediate access
      if (session?.access_token) {
        localStorage.setItem('authToken', session.access_token);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Update the token in localStorage when the session changes
      if (session?.access_token) {
        localStorage.setItem('authToken', session.access_token);
      } else {
        localStorage.removeItem('authToken');
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (provider: 'google' | 'github' | 'email', email?: string, password?: string) => {
    try {
      if (provider === 'email') {
        if (!email || !password) {
          throw new Error('Email and password are required');
        }
        
        // Get CAPTCHA token (for email sign-ins)
        const captchaToken = getCaptchaToken();
        if (!captchaToken) return;
        
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: {
            captchaToken
          }
        });
        
        if (error) throw error;
        
        toast({
          title: 'Signed in successfully',
          description: `Welcome back, ${email}!`,
        });
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
        });
        
        if (error) throw error;
      }
    } catch (error: any) {
      toast({
        title: 'Error signing in',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // Get CAPTCHA token
      const captchaToken = getCaptchaToken();
      if (!captchaToken) return;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          captchaToken
        },
      });
      
      if (error) throw error;
      
      toast({
        title: 'Verification email sent',
        description: 'Please check your email to verify your account.',
      });
    } catch (error: any) {
      toast({
        title: 'Error signing up',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: 'Signed out successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error signing out',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut }}>
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
