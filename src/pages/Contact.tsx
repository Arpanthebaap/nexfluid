import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
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
    name: '', surname: '', email: '', phone: '', message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('quote_requests').insert({
        name: `${form.name} ${form.surname}`.trim(),
        email: form.email,
        phone: form.phone || null,
        message: form.message || null,
        language: lang as 'it' | 'en',
      });

      if (error) throw error;

      supabase.functions.invoke('quote-notify', {
        body: {
          name: `${form.name} ${form.surname}`.trim(),
          email: form.email,
          phone: form.phone || null,
          message: form.message || null,
          language: lang,
        },
      }).catch(console.error);

      toast({ title: t('quote.success'), description: t('quote.successDesc') });
      setForm({ name: '', surname: '', email: '', phone: '', message: '' });
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
        <html lang={lang} />
        <title>{lang === 'it' ? 'Contatti | Nexfluid' : 'Contact Us | Nexfluid'}</title>
        <meta name="description" content={lang === 'it'
          ? 'Contattaci per un preventivo su valvole, pneumatica, idraulica e automazione industriale.'
          : 'Contact us for a quote on valves, pneumatics, hydraulics and industrial automation.'
        } />
        <link rel="alternate" hrefLang="it" href="https://nexfluid.it/contact" />
        <link rel="alternate" hrefLang="en" href="https://nexfluid.com/contact" />
        <link rel="alternate" hrefLang="x-default" href="https://nexfluid.it/contact" />
      </Helmet>

      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl font-display uppercase text-primary">
            {lang === 'it' ? 'CONTATTACI' : 'CONTACT US'}
          </h1>

          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            {/* Left - Contact Info */}
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">
                    {lang === 'it' ? 'Chiamaci:' : 'Call us:'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground pl-7">
                  Tel 049.8016529 — Fax 049.8016551
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">
                    {lang === 'it' ? 'Contattaci su WhatsApp:' : 'Contact us on WhatsApp:'}
                  </span>
                </div>
                <a href="https://wa.me/393338933395" target="_blank" rel="noopener noreferrer"
                  className="text-sm text-muted-foreground pl-7 hover:text-primary transition-colors block">
                  +39 333.8933395
                </a>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">
                    {lang === 'it' ? 'Scrivici:' : 'Mail us:'}
                  </span>
                </div>
                <a href="mailto:info@nexfluid.it"
                  className="text-sm text-muted-foreground pl-7 hover:text-primary transition-colors block">
                  info@nexfluid.it
                </a>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">
                    {lang === 'it' ? 'Posizione:' : 'Position:'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground pl-7">
                  Via De Gasperi, 6 Z.i. Saccolongo (PD)
                </p>
              </div>
            </div>

            {/* Right - Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-primary font-semibold">
                    {lang === 'it' ? 'Nome' : 'Name'} *
                  </Label>
                  <Input id="name" required value={form.name} onChange={(e) => update('name', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="surname" className="text-primary font-semibold">
                    {lang === 'it' ? 'Cognome' : 'Surname'} *
                  </Label>
                  <Input id="surname" required value={form.surname} onChange={(e) => update('surname', e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-primary font-semibold">Mail *</Label>
                  <Input id="email" type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-primary font-semibold">
                    {lang === 'it' ? 'Telefono' : 'Telephone'}
                  </Label>
                  <Input id="phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-primary font-semibold">
                  {lang === 'it' ? 'Messaggio' : 'Message'}
                </Label>
                <Textarea id="message" rows={5} value={form.message} onChange={(e) => update('message', e.target.value)} />
              </div>
              <Button type="submit" disabled={loading} className="uppercase">
                {loading ? '...' : (lang === 'it' ? 'INVIA' : 'SEND')}
              </Button>
            </form>
          </div>

          {/* Google Maps */}
          <div className="mt-12 overflow-hidden rounded-lg border">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2798.8!2d11.75!3d45.38!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDIyJzQ4LjAiTiAxMcKwNDUnMDAuMCJF!5e0!3m2!1sit!2sit!4v1700000000000!5m2!1sit!2sit"
              width="100%"
              height="350"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={lang === 'it' ? 'La nostra posizione' : 'Our location'}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
