

# Fix: Infinite Re-render Loop on Admin Login Page

## Root Cause

The `useAuth` hook has an infinite render loop. The `user` effect dependency (`[user]`) triggers every time `onAuthStateChange` fires because Supabase creates a **new user object** on each event (different object reference, same user ID). This causes:

1. `getSession()` sets user → triggers `has_role` effect
2. `onAuthStateChange` fires → sets a new user object (same ID, new reference) → triggers `has_role` effect again
3. Each `has_role` response triggers `setIsAdmin`/`setLoading` → re-render
4. Multiple `useAuth` instances (AdminLogin + ProtectedRoute) multiply this
5. Result: dozens of `has_role` RPC calls per second, constant DOM re-renders, input fields lose focus

The session replay confirms: the login form "structure is updated" every ~300ms, and network logs show 30+ `has_role` calls in 5 seconds.

## Fix

Track user ID with a `useRef` and only call `has_role` when the user ID actually changes:

**File: `src/hooks/useAuth.ts`**

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastCheckedUserId = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session?.user) {
          lastCheckedUserId.current = null;
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && user.id !== lastCheckedUserId.current) {
      lastCheckedUserId.current = user.id;
      supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' })
        .then(({ data }) => { setIsAdmin(!!data); setLoading(false); })
        .catch(() => { setIsAdmin(false); setLoading(false); });
    } else if (!user) {
      lastCheckedUserId.current = null;
      setIsAdmin(false);
      setLoading(false);
    }
  }, [user]);

  // signIn, signOut unchanged
}
```

Key change: `lastCheckedUserId` ref prevents duplicate RPC calls when the same user object is re-created by `onAuthStateChange`. This stops the infinite loop.

## Files Modified

| File | Change |
|------|--------|
| `src/hooks/useAuth.ts` | Add `useRef` guard to prevent infinite `has_role` loop |

