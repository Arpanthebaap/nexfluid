import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';

const ResetPassword = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'it' | 'en';
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  const t = {
    it: {
      title: 'Reimposta Password',
      newPassword: 'Nuova Password',
      confirmPassword: 'Conferma Password',
      save: 'Salva Nuova Password',
      success: 'Password aggiornata!',
      successDesc: 'La tua password è stata aggiornata con successo.',
      goToLogin: 'Vai al Login',
      mismatch: 'Le password non corrispondono',
      error: 'Errore durante il reset della password',
      invalidLink: 'Link non valido. Richiedi un nuovo link di recupero.',
    },
    en: {
      title: 'Reset Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      save: 'Save New Password',
      success: 'Password updated!',
      successDesc: 'Your password has been updated successfully.',
      goToLogin: 'Go to Sign In',
      mismatch: 'Passwords do not match',
      error: 'Error resetting password',
      invalidLink: 'Invalid link. Please request a new reset link.',
    },
  }[lang];

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: t.mismatch, variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: t.error, description: error.message, variant: 'destructive' });
    } else {
      setSuccess(true);
    }
  };

  if (!isRecovery && !success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">{t.invalidLink}</p>
            <Link to="/forgot-password" className="mt-4 inline-block text-sm text-primary hover:underline">
              {lang === 'it' ? 'Richiedi nuovo link' : 'Request new link'}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t.title} | Nexfluid</title>
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
            <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <h2 className="text-lg font-semibold text-foreground">{t.success}</h2>
                <p className="text-sm text-muted-foreground">{t.successDesc}</p>
                <Button onClick={() => navigate('/sign-in')}>{t.goToLogin}</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t.newPassword}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t.save}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ResetPassword;
