import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Truck, ShieldCheck, Headphones } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import OurBrands from '@/components/shared/OurBrands';
import SpeakWithUs from '@/components/shared/SpeakWithUs';
import ShippingSecurity from '@/components/shared/ShippingSecurity';
import BrandsSidebar from '@/components/shared/BrandsSidebar';

type Category = {
  id: string;
  slug: string;
  name_it: string;
  name_en: string;
  description_it: string | null;
  description_en: string | null;
  image_url: string | null;
  parent_id: string | null;
};

const Index = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'it' | 'en';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      setCategories(data || []);
      setLoading(false);
    };
    fetchCategories();
  }, []);

  const catName = (cat: Category) => lang === 'it' ? cat.name_it : cat.name_en;
  const catDesc = (cat: Category) => lang === 'it' ? cat.description_it : cat.description_en;

  const topCategories = categories.filter(c => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  const trustItems = [
    { icon: Truck, label: lang === 'it' ? 'Spedizione Express' : 'Express Shipping' },
    { icon: ShieldCheck, label: lang === 'it' ? 'Prodotti Originali' : 'Original Parts' },
    { icon: Headphones, label: lang === 'it' ? 'Supporto Tecnico' : 'Technical Support' },
  ];

  return (
    <>
      <Helmet>
        <html lang={lang} />
        <title>{lang === 'it' ? 'Nexfluid — Automazione in Stock' : 'Nexfluid — Automation in Stock'}</title>
        <meta name="description" content={lang === 'it'
          ? 'Oltre 85.000 componenti industriali: valvole, pneumatica, idraulica, automazione. Preventivi rapidi, ricambi originali, spedizione express in Italia e UE.'
          : '85,000+ industrial components: valves, pneumatics, hydraulics, automation. Fast quotes, original parts, express shipping across Italy and EU.'
        } />
        <link rel="canonical" href={lang === 'en' ? 'https://nexfluid.com/' : 'https://nexfluid.it/'} />
        <link rel="alternate" hrefLang="it" href="https://nexfluid.it/" />
        <link rel="alternate" hrefLang="en" href="https://nexfluid.com/" />
        <link rel="alternate" hrefLang="x-default" href="https://nexfluid.it/" />
      </Helmet>

      {/* Trust Strip */}
      <div className="border-b bg-muted/50">
        <div className="container mx-auto px-4 py-2.5 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {trustItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-muted-foreground">
              <item.icon className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-8">
          <BrandsSidebar />

          <div className="flex-1 min-w-0">
            <OurBrands />

            {/* Category Sections */}
            <section className="py-8 space-y-10">
              {loading ? (
                <div className="space-y-8">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-6 w-40 bg-muted rounded mb-4" />
                      <div className="flex gap-6">
                        <div className="hidden md:block w-64 h-44 bg-muted rounded" />
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[...Array(6)].map((_, j) => (
                            <div key={j} className="h-10 bg-muted rounded" />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                topCategories.map((parent, idx) => {
                  const children = getChildren(parent.id);
                  return (
                    <div key={parent.id}>
                      <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-lg font-bold sm:text-xl font-display uppercase tracking-tight text-foreground">
                          {catName(parent)}
                        </h2>
                        <div className="flex-1 h-px bg-border" />
                        <Link
                          to={`/categories/${parent.slug}`}
                          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
                        >
                          {lang === 'it' ? 'Vedi tutto' : 'View All'} <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>

                      <div className="flex gap-5">
                        {parent.image_url && (
                          <Link
                            to={`/categories/${parent.slug}`}
                            className="hidden md:block w-56 lg:w-64 shrink-0 rounded border bg-card overflow-hidden hover:shadow-md transition-shadow"
                          >
                            <img
                              src={parent.image_url}
                              alt={catName(parent)}
                              className="w-full h-full object-cover aspect-[4/3]"
                              loading="lazy"
                            />
                          </Link>
                        )}

                        <div className="flex-1 min-w-0">
                          {children.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {children.map((child) => (
                                <Link
                                  key={child.id}
                                  to={`/categories/${child.slug}`}
                                  className="group flex items-center gap-3 rounded border bg-card p-2.5 hover:shadow-sm hover:border-primary/30 transition-all"
                                >
                                  {child.image_url && (
                                    <img
                                      src={child.image_url}
                                      alt={catName(child)}
                                      className="w-10 h-10 rounded object-cover shrink-0"
                                      loading="lazy"
                                    />
                                  )}
                                  <span className="text-xs sm:text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                    {catName(child)}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {catDesc(parent) || (lang === 'it' ? 'Esplora la categoria' : 'Explore the category')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          </div>
        </div>
      </div>

      <SpeakWithUs />
      <ShippingSecurity />
    </>
  );
};

export default Index;
