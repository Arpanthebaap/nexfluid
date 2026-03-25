import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Package, Users, Award, Globe } from 'lucide-react';

const About = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const stats = [
    { icon: Package, value: '85,000+', label: lang === 'it' ? 'Prodotti' : 'Products' },
    { icon: Users, value: '500+', label: lang === 'it' ? 'Clienti' : 'Clients' },
    { icon: Award, value: '50+', label: lang === 'it' ? 'Brand' : 'Brands' },
    { icon: Globe, value: '2', label: lang === 'it' ? 'Mercati' : 'Markets' },
  ];

    return (
    <div className="py-12 md:py-16">
      <Helmet>
        <title>{lang === 'it' ? 'Chi Siamo | Nexfluid' : 'About Us | Nexfluid'}</title>
        <meta name="description" content={lang === 'it'
          ? 'Nexfluid: il tuo partner per soluzioni industriali di precisione. Oltre 85.000 prodotti, 50+ brand, spedizione express.'
          : 'Nexfluid: your partner for precision industrial solutions. 85,000+ products, 50+ brands, express shipping.'
        } />
        <link rel="alternate" hrefLang="it" href="https://nexfluid.it/about" />
        <link rel="alternate" hrefLang="en" href="https://nexfluid.com/about" />
        <link rel="alternate" hrefLang="x-default" href="https://nexfluid.it/about" />
      </Helmet>
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl font-display uppercase text-primary">
            {lang === 'it' ? 'Chi Siamo' : 'About Us'}
          </h1>
          <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
            <p>
              {lang === 'it'
                ? 'Nexfluid è il tuo partner di riferimento per soluzioni industriali di precisione. Specializzati in valvole, pneumatica, idraulica e automazione industriale, offriamo un catalogo di oltre 85.000 prodotti dai migliori produttori mondiali.'
                : 'Nexfluid is your trusted partner for precision industrial solutions. Specializing in valves, pneumatics, hydraulics and industrial automation, we offer a catalog of over 85,000 products from the world\'s leading manufacturers.'}
            </p>
            <p>
              {lang === 'it'
                ? 'Il nostro team di esperti tecnici è pronto ad assisterti nella scelta del prodotto giusto per la tua applicazione. Garantiamo preventivi rapidi, prezzi competitivi e prodotti originali con certificazione completa.'
                : 'Our team of technical experts is ready to assist you in choosing the right product for your application. We guarantee fast quotes, competitive pricing and original products with full certification.'}
            </p>
          </div>

          {/* Content will be provided by SocialVision */}
          <p className="mt-6 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4 text-sm text-muted-foreground italic">
            {lang === 'it'
              ? '📝 Contenuto completo in fase di elaborazione da SocialVision.'
              : '📝 Full content being prepared by SocialVision.'}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-lg border bg-card p-6 text-center"
            >
              <stat.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
