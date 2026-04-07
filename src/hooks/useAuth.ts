import { useState, useEffect, useRef, useCallback, createContext, useContext, type ReactNode } from 'react';
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastCheckedUserId = useRef<string | null>(null);
  const currentUserId = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      const uid = s?.user?.id ?? null;
      if (uid !== currentUserId.current) {
        currentUserId.current = uid;
        setSession(s);
        setUser(s?.user ?? null);
      }
      if (!s?.user) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        const uid = s?.user?.id ?? null;
        if (uid !== currentUserId.current) {
          currentUserId.current = uid;
          setSession(s);
          setUser(s?.user ?? null);
          if (!s?.user) {
            lastCheckedUserId.current = null;
            setIsAdmin(false);
            setLoading(false);
          }
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && user.id !== lastCheckedUserId.current) {
      lastCheckedUserId.current = user.id;
      Promise.resolve(supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }))
        .then(({ data }) => { setIsAdmin(!!data); setLoading(false); })
        .catch(() => { setIsAdmin(false); setLoading(false); });
    } else if (!user) {
      lastCheckedUserId.current = null;
      setIsAdmin(false);
      setLoading(false);
    }
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = { user, session, isAdmin, loading, signIn, signUp, signOut };

  return React.createElement(AuthContext.Provider, { value }, children);
}

const defaultAuthState: AuthState = {
  user: null,
  session: null,
  isAdmin: false,
  loading: true,
  signIn: async () => ({ error: new Error('AuthProvider not mounted') }),
  signUp: async () => ({ error: new Error('AuthProvider not mounted') }),
  signOut: async () => {},
};

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  return ctx ?? defaultAuthState;
}
