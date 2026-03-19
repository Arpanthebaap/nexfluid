import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, Package, Headphones, Zap, ShieldCheck, ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PLACEHOLDER_CATEGORIES = [
  { name_it: 'Elettrovalvole', name_en: 'Solenoid Valves', slug: 'solenoid-valves', count: 12400, icon: '⚡' },
  { name_it: 'Valvole a Sfera', name_en: 'Ball Valves', slug: 'ball-valves', count: 8200, icon: '🔵' },
  { name_it: 'Cilindri Pneumatici', name_en: 'Pneumatic Cylinders', slug: 'pneumatic-cylinders', count: 9500, icon: '🔧' },
  { name_it: 'Raccordi', name_en: 'Fittings', slug: 'fittings', count: 15600, icon: '🔩' },
  { name_it: 'Regolatori di Pressione', name_en: 'Pressure Regulators', slug: 'pressure-regulators', count: 4300, icon: '📊' },
  { name_it: 'Filtri', name_en: 'Filters', slug: 'filters', count: 6100, icon: '🔬' },
];

const Index = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const lang = i18n.language as 'it' | 'en';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const features = [
    { icon: Package, title: t('features.catalog'), desc: t('features.catalogDesc') },
    { icon: Headphones, title: t('features.support'), desc: t('features.supportDesc') },
    { icon: Zap, title: t('features.delivery'), desc: t('features.deliveryDesc') },
    { icon: ShieldCheck, title: t('features.quality'), desc: t('features.qualityDesc') },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[hsl(var(--nexfluid-navy))] text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, hsl(210 100% 40% / 0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, hsl(25 95% 53% / 0.2) 0%, transparent 50%)'
          }} />
        </div>
        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl font-['Space_Grotesk']">
              {t('hero.title')}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg">
              {t('hero.subtitle')}
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t('hero.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 w-full rounded-lg border-0 bg-white pl-12 pr-28 text-foreground shadow-lg md:h-14 md:text-base"
                />
                <Button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[hsl(var(--nexfluid-orange))] hover:bg-[hsl(var(--nexfluid-orange))]/90 text-white font-medium"
                >
                  <Search className="mr-1.5 h-4 w-4" />
                  {lang === 'it' ? 'Cerca' : 'Search'}
                </Button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-white/50">
              <span>{lang === 'it' ? 'Cerca ad esempio:' : 'Try searching:'}</span>
              {['SCE262C080', 'ASCO 8210', 'Parker D1VW'].map((code) => (
                <button
                  key={code}
                  onClick={() => { setSearchQuery(code); navigate(`/search?q=${encodeURIComponent(code)}`); }}
                  className="rounded-full border border-white/20 px-3 py-1 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {code}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl font-['Space_Grotesk']">
              {t('categories.title')}
            </h2>
            <p className="mt-2 text-muted-foreground">{t('categories.subtitle')}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLACEHOLDER_CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <Link
                  to={`/categories/${cat.slug}`}
                  className="group flex items-center gap-4 rounded-lg border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--nexfluid-blue-light))] text-xl">
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {lang === 'it' ? cat.name_it : cat.name_en}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {cat.count.toLocaleString()} {lang === 'it' ? 'prodotti' : 'products'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button variant="outline" asChild className="gap-2">
              <Link to="/categories">
                {t('categories.viewAll')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/50 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl font-['Space_Grotesk']">
            {t('features.title')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="rounded-lg border bg-card p-6 text-center shadow-sm"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <feat.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl font-['Space_Grotesk']">
            {lang === 'it' ? 'Hai bisogno di un preventivo?' : 'Need a quote?'}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            {lang === 'it'
              ? 'Contattaci oggi stesso. Il nostro team risponde entro 24 ore con prezzi competitivi.'
              : 'Contact us today. Our team responds within 24 hours with competitive pricing.'}
          </p>
          <Button asChild size="lg" className="mt-6 bg-[hsl(var(--nexfluid-orange))] hover:bg-[hsl(var(--nexfluid-orange))]/90 text-white font-semibold">
            <Link to="/contact">{t('nav.requestQuote')}</Link>
          </Button>
        </div>
      </section>
    </>
  );
};

export default Index;
