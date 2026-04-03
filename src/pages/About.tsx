import { useTranslation } from 'react-i18next';
import aboutHeroImage from '@/assets/about-hero-industrial.jpg';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import OurBrands from '@/components/shared/OurBrands';
import SpeakWithUs from '@/components/shared/SpeakWithUs';
import ShippingSecurity from '@/components/shared/ShippingSecurity';

const offerCategories = [
  {
    title: { en: 'Valves', it: 'Valvole' },
    desc: {
      en: 'Wide range of industrial valves including solenoid, ball, butterfly, and control valves from leading manufacturers.',
      it: 'Ampia gamma di valvole industriali tra cui elettrovalvole, a sfera, a farfalla e di controllo dai principali produttori.',
    },
    image: '/categories/valves.jpg',
    link: '/categories',
  },
  {
    title: { en: 'Hydraulic', it: 'Idraulica' },
    desc: {
      en: 'Complete hydraulic solutions including pumps, motors, cylinders, and accessories for industrial applications.',
      it: 'Soluzioni idrauliche complete tra cui pompe, motori, cilindri e accessori per applicazioni industriali.',
    },
    image: '/categories/hydraulic.jpg',
    link: '/categories',
  },
  {
    title: { en: 'Pneumatic', it: 'Pneumatica' },
    desc: {
      en: 'Pneumatic components and systems including actuators, FRL units, fittings, and tubing for automation.',
      it: 'Componenti e sistemi pneumatici tra cui attuatori, unità FRL, raccordi e tubazioni per l\'automazione.',
    },
    image: '/categories/pneumatic.jpg',
    link: '/categories',
  },
  {
    title: { en: 'Vacuum', it: 'Vuoto' },
    desc: {
      en: 'Vacuum technology products including pumps, generators, cups, and sensors for handling and automation.',
      it: 'Prodotti per la tecnologia del vuoto tra cui pompe, generatori, ventose e sensori per la movimentazione.',
    },
    image: '/categories/vacuum.jpg',
    link: '/categories',
  },
];

const About = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <>
      <Helmet>
        <title>{lang === 'it' ? 'Chi Siamo | Nexfluid' : 'About Us | Nexfluid'}</title>
        <meta name="description" content={lang === 'it'
          ? 'Nexfluid: il tuo partner per soluzioni industriali di precisione. Oltre 85.000 prodotti, 50+ brand, spedizione express.'
          : 'Nexfluid: your partner for precision industrial solutions. 85,000+ products, 50+ brands, express shipping.'
        } />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-background py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 md:grid-cols-2 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-display uppercase text-primary">
                NEXFLUID
              </h1>
              <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed text-sm">
                <p>
                  {lang === 'it'
                    ? 'Nexfluid è il tuo partner di riferimento per soluzioni industriali di precisione. Specializzati in valvole, pneumatica, idraulica e automazione industriale, offriamo un catalogo di oltre 85.000 prodotti dai migliori produttori mondiali.'
                    : 'Nexfluid operates in the field of hydraulic and pneumatic components.\n\nThe high quality of the components we supply is the result of careful research and selection among the best manufacturers worldwide in this sector.'}
                </p>
                <p>
                  {lang === 'it'
                    ? 'Il nostro team di esperti tecnici è pronto ad assisterti nella scelta del prodotto giusto per la tua applicazione. Garantiamo preventivi rapidi, prezzi competitivi e prodotti originali con certificazione completa.'
                    : 'We work with a direct and pragmatic approach, focused on real industrial needs, selecting solutions designed to integrate easily into existing systems and simplify installation and maintenance activities.'}
                </p>
                <p>
                  {lang === 'it'
                    ? 'Con una rete di distribuzione che copre Italia e Unione Europea, offriamo servizi di spedizione rapida e consegna express in 24 ore per soddisfare le esigenze più urgenti della tua produzione.'
                    : 'Our goal is to ensure operational continuity and fast response times, providing practical technical support and timely supply in line with production requirements.'}
                </p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <div className="rounded-lg overflow-hidden bg-muted aspect-[4/3] flex items-center justify-center">
                <img
                  src={aboutHeroImage}
                  alt="Nexfluid industrial products"
                  className="w-full h-full object-cover"
                />
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-12 md:py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-xl font-bold sm:text-2xl font-display uppercase tracking-tight text-inherit">
            {lang === 'it' ? 'COSA OFFRIAMO' : 'WHAT WE OFFER'}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-primary-foreground">
            {lang === 'it'
              ? 'Offriamo una vasta gamma di prodotti industriali di alta qualità per soddisfare ogni esigenza applicativa.'
              : 'We specialize in the supply of valves and components for pneumatic, hydraulic and vacuum systems. We maintain a large stock of products ready for immediate delivery to ensure operational continuity. In addition to supply, we provide technical support for component selection, installation and commissioning, including configuration and programming when required.'}
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {offerCategories.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-lg border bg-card p-6 text-center space-y-4"
              >
                <div className="mx-auto h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  <img src={cat.image} alt={cat.title[lang === 'it' ? 'it' : 'en']} className="h-14 w-14 object-contain" />
                </div>
                <h3 className="text-sm font-bold text-foreground uppercase">
                  {cat.title[lang === 'it' ? 'it' : 'en']}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {cat.desc[lang === 'it' ? 'it' : 'en']}
                </p>
                <Link to={cat.link} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  {lang === 'it' ? 'Scopri di più' : 'Discover more'} <ArrowRight className="h-3 w-3" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Brands */}
      <section className="bg-background py-12 md:py-16">
        <div className="container mx-auto px-4">
          <OurBrands />
        </div>
      </section>

      <SpeakWithUs />
      <ShippingSecurity />
    </>
  );
};

export default About;
