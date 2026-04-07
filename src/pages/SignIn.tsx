import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';

const SignIn = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'it' | 'en';
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const t = {
    it: {
      signIn: 'Accedi',
      signUp: 'Registrati',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Conferma Password',
      forgotPassword: 'Password dimenticata?',
      noAccount: 'Non hai un account?',
      hasAccount: 'Hai già un account?',
      signInBtn: 'Accedi',
      signUpBtn: 'Registrati',
      passwordMismatch: 'Le password non corrispondono',
      signUpSuccess: 'Registrazione completata! Controlla la tua email per verificare il tuo account.',
      signInError: 'Email o password non validi',
      signUpError: 'Errore durante la registrazione',
      welcome: 'Benvenuto su Nexfluid',
      subtitle: 'Accedi al tuo account per gestire preventivi e ordini',
    },
    en: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot password?',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      signInBtn: 'Sign In',
      signUpBtn: 'Sign Up',
      passwordMismatch: 'Passwords do not match',
      signUpSuccess: 'Registration complete! Check your email to verify your account.',
      signInError: 'Invalid email or password',
      signUpError: 'Error during registration',
      welcome: 'Welcome to Nexfluid',
      subtitle: 'Sign in to manage your quotes and orders',
    },
  }[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (mode === 'register' && password !== confirmPassword) {
      toast({ title: t.passwordMismatch, variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: t.signInError, description: error.message, variant: 'destructive' });
        } else {
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast({ title: t.signUpError, description: error.message, variant: 'destructive' });
        } else {
          toast({ title: t.signUpSuccess });
          setMode('login');
          setPassword('');
          setConfirmPassword('');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{mode === 'login' ? t.signIn : t.signUp} | Nexfluid</title>
      </Helmet>
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center space-y-4 pb-2">
            <Link to="/">
              <img
                src="/lovable-uploads/04244b88-7e59-4987-9f7a-81be85561eac.png"
                alt="Nexfluid"
                className="h-10 w-auto rounded bg-primary p-1.5"
              />
            </Link>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">{t.welcome}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
            </div>
            {/* Tabs */}
            <div className="flex w-full rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  mode === 'login'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.signIn}
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  mode === 'register'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.signUp}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              )}

              {mode === 'login' && (
                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    {t.forgotPassword}
                  </Link>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'login' ? t.signInBtn : t.signUpBtn}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {mode === 'login' ? t.noAccount : t.hasAccount}{' '}
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="font-medium text-primary hover:underline"
              >
                {mode === 'login' ? t.signUp : t.signIn}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SignIn;
