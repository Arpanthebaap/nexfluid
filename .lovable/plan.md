

# Fix: Admin Pages Stuck on Loading Spinner

## Root Cause

The `useAuth` hook has a race condition / potential deadlock. It performs async database calls (`has_role` RPC) inside `onAuthStateChange`, which is a known anti-pattern with Supabase. The `onAuthStateChange` listener can block when async work is done inside it, preventing `loading` from ever becoming `false`.

Both the `onAuthStateChange` callback and `getSession().then()` call `has_role` independently, creating duplicate async RPC calls that can race and leave state inconsistent.

## Fix

Restructure `useAuth` to:
1. Use `onAuthStateChange` only for setting user/session state (no async DB calls inside it)
2. Check admin role in a separate `useEffect` that triggers when `user` changes
3. Ensure `loading` is set to `false` reliably in all code paths

## File to modify

`src/hooks/useAuth.ts` — rewrite to separate auth state from role checking:

```typescript
useEffect(() => {
  // Only set user/session, no async DB calls
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    }
  );
  return () => subscription.unsubscribe();
}, []);

// Separate effect for role check
useEffect(() => {
  if (user) {
    supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' })
      .then(({ data }) => { setIsAdmin(!!data); setLoading(false); });
  } else {
    setIsAdmin(false);
    setLoading(false);
  }
}, [user]);
```

This eliminates the deadlock by never doing async work inside `onAuthStateChange`, and ensures `loading` always resolves.

