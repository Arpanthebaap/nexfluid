import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Contact = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const lang = i18n.language;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '', product: '', message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('quote_requests').insert({
        name: form.name,
        company: form.company || null,
        email: form.email,
        phone: form.phone || null,
        product_name: form.product || null,
        message: form.message || null,
        language: lang as 'it' | 'en',
      });

      if (error) throw error;

      // Send email notification
      supabase.functions.invoke('quote-notify', {
        body: {
          name: form.name,
          email: form.email,
          company: form.company || null,
          phone: form.phone || null,
          product_name: form.product || null,
          message: form.message || null,
          language: lang,
        },
      }).catch(console.error);

      toast({ title: t('quote.success'), description: t('quote.successDesc') });
      setForm({ name: '', company: '', email: '', phone: '', product: '', message: '' });
    } catch {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

    return (
    <div className="py-12 md:py-16">
      <Helmet>
        <title>{lang === 'it' ? 'Contatti — Richiedi Preventivo | Nexfluid' : 'Contact — Request a Quote | Nexfluid'}</title>
        <meta name="description" content={lang === 'it'
          ? 'Contattaci per un preventivo su valvole, pneumatica, idraulica e automazione industriale. Risposta entro 24 ore.'
          : 'Contact us for a quote on valves, pneumatics, hydraulics and industrial automation. Response within 24 hours.'
        } />
      </Helmet>
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl font-display uppercase text-primary">
            {t('quote.title')}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {lang === 'it'
              ? 'Compila il modulo e ti risponderemo entro 24 ore.'
              : 'Fill out the form and we\'ll respond within 24 hours.'}
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Contact info */}
            <div className="space-y-6 lg:col-span-1">
              <div className="rounded-lg border bg-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <a href="mailto:info@nexfluid.it" className="text-sm text-muted-foreground hover:text-primary">info@nexfluid.it</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{lang === 'it' ? 'Telefono' : 'Phone'}</p>
                    <a href="tel:+39000000000" className="text-sm text-muted-foreground hover:text-primary">+39 000 000 0000</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{lang === 'it' ? 'Sede' : 'Location'}</p>
                    <p className="text-sm text-muted-foreground">Italy</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 lg:col-span-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">{t('quote.name')} *</Label>
                  <Input id="name" required value={form.name} onChange={(e) => update('name', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company">{t('quote.company')}</Label>
                  <Input id="company" value={form.company} onChange={(e) => update('company', e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email">{t('quote.email')} *</Label>
                  <Input id="email" type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">{t('quote.phone')}</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product">{t('quote.product')}</Label>
                <Input id="product" value={form.product} onChange={(e) => update('product', e.target.value)} placeholder={lang === 'it' ? 'Es. SCE262C080' : 'E.g. SCE262C080'} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">{t('quote.message')}</Label>
                <Textarea id="message" rows={4} value={form.message} onChange={(e) => update('message', e.target.value)} />
              </div>
              <Button type="submit" disabled={loading} className="gap-2 bg-[hsl(var(--nexfluid-orange))] hover:bg-[hsl(var(--nexfluid-orange))]/90">
                <Send className="h-4 w-4" />
                {loading ? '...' : t('quote.submit')}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
