

# Build Public Sign In Page with Forgot Password

## Problem

The header "Sign in" button links to `/contact` instead of a proper login page. There is no public-facing sign-in page — only the admin login at `/admin/login`.

## Approach

This is a B2B industrial components site. A customer sign-in page makes sense for future features like order tracking, saved quotes, and account management. For now, we build a polished sign-in page with email/password login, sign-up, and forgot password — all using the existing auth system.

## Plan

### 1. Create `src/pages/SignIn.tsx`
A professional sign-in page with:
- Nexfluid logo at the top
- Tabbed or toggled view: **Sign In** / **Sign Up**
- Sign In form: email + password + "Forgot password?" link
- Sign Up form: email + password + confirm password
- Error handling and loading states
- Bilingual support (IT/EN) using `i18n.language`
- Styled with the site's primary blue theme, consistent with the existing design system
- After successful sign-in, redirect to homepage (or back to previous page)
- After sign-up, show confirmation message about email verification

### 2. Create `src/pages/ForgotPassword.tsx`
- Email input to request password reset
- Calls `supabase.auth.resetPasswordForEmail()` with redirect to `/reset-password`
- Success message after submission
- Link back to sign-in page

### 3. Create `src/pages/ResetPassword.tsx`
- Checks URL for `type=recovery` token
- New password + confirm password form
- Calls `supabase.auth.updateUser({ password })`
- Success → redirect to sign-in
- Public route (not behind auth)

### 4. Update `src/App.tsx`
- Add lazy routes: `/sign-in`, `/forgot-password`, `/reset-password` under PublicLayout

### 5. Update `src/components/layout/Header.tsx`
- Change "Sign in" link from `/contact` to `/sign-in`
- When user is logged in, show user icon/name with sign-out option instead of "Sign in"

### 6. Update `src/hooks/useAuth.ts`
- Add `signUp` method to the auth context (wrapping `supabase.auth.signUp`)

## Files to modify/create

| File | Change |
|------|--------|
| `src/pages/SignIn.tsx` | New — sign in + sign up page |
| `src/pages/ForgotPassword.tsx` | New — forgot password page |
| `src/pages/ResetPassword.tsx` | New — reset password page |
| `src/App.tsx` | Add 3 new lazy routes |
| `src/components/layout/Header.tsx` | Update sign-in link, show logged-in state |
| `src/hooks/useAuth.ts` | Add signUp method |

