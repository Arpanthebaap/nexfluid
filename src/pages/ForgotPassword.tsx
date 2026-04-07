import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const ForgotPassword = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'it' | 'en';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const t = {
    it: {
      title: 'Recupera Password',
      subtitle: 'Inserisci la tua email e ti invieremo un link per reimpostare la password.',
      email: 'Email',
      send: 'Invia Link di Recupero',
      sent: 'Email inviata!',
      sentDesc: 'Controlla la tua casella di posta per il link di recupero password.',
      back: 'Torna al Login',
    },
    en: {
      title: 'Forgot Password',
      subtitle: "Enter your email and we'll send you a link to reset your password.",
      email: 'Email',
      send: 'Send Reset Link',
      sent: 'Email sent!',
      sentDesc: 'Check your inbox for the password reset link.',
      back: 'Back to Sign In',
    },
  }[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    setSent(true);
  };

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
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
            </div>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <h2 className="text-lg font-semibold text-foreground">{t.sent}</h2>
                <p className="text-sm text-muted-foreground">{t.sentDesc}</p>
                <Link to="/sign-in">
                  <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t.back}
                  </Button>
                </Link>
              </div>
            ) : (
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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t.send}
                </Button>
                <div className="text-center">
                  <Link to="/sign-in" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" />
                    {t.back}
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ForgotPassword;
