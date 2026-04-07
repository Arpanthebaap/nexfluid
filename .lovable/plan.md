

# Enhance Admin Login Page (WordPress-style)

## Current State
The admin login at `/admin/login` is a minimal card with email, password, and a submit button. No forgot password link, no password visibility toggle, no logo, no polish.

## Plan

### Update `src/pages/admin/AdminLogin.tsx`
Transform into a polished WordPress-style admin login:

- **Nexfluid logo** at the top of the card
- **Password visibility toggle** (eye icon) like the public sign-in page
- **"Forgot password?" link** below the password field, linking to `/admin/forgot-password`
- **"Back to website" link** at the bottom pointing to `/`
- **Better error display** with the existing destructive styling
- Keep the existing redirect-if-admin logic

### Create `src/pages/admin/AdminForgotPassword.tsx`
A standalone admin forgot-password page (not wrapped in PublicLayout):
- Same full-screen centered card layout as AdminLogin
- Nexfluid logo + "Admin Password Recovery" heading
- Email input → calls `supabase.auth.resetPasswordForEmail` with redirect to `/admin/reset-password`
- Success state with check icon
- "Back to Admin Login" link

### Create `src/pages/admin/AdminResetPassword.tsx`
Handles the recovery token redirect:
- New password + confirm password fields with visibility toggle
- Calls `supabase.auth.updateUser({ password })`
- On success, redirects to `/admin/login`
- "Back to Admin Login" link

### Update `src/App.tsx`
Add two new lazy-loaded routes (outside ProtectedRoute):
- `/admin/forgot-password` → `AdminForgotPassword`
- `/admin/reset-password` → `AdminResetPassword`

## Files to modify/create
| File | Change |
|------|--------|
| `src/pages/admin/AdminLogin.tsx` | Add logo, password toggle, forgot password link, back-to-site link |
| `src/pages/admin/AdminForgotPassword.tsx` | New — admin password recovery page |
| `src/pages/admin/AdminResetPassword.tsx` | New — admin password reset page |
| `src/App.tsx` | Add 2 new lazy admin routes |

