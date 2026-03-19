import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
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

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .is('parent_id', null)
        .order('sort_order');
      setCategories(data || []);
    };
    fetchCategories();
  }, []);

  const catName = (cat: Category) => lang === 'it' ? cat.name_it : cat.name_en;
  const catDesc = (cat: Category) => lang === 'it' ? cat.description_it : cat.description_en;

  return (
    <>
      {/* Main content with sidebar */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <BrandsSidebar />

          <div className="flex-1 min-w-0">
            {/* Our Brands */}
            <OurBrands />

            {/* Categories */}
            <section className="py-10">
              <h2 className="text-2xl font-bold sm:text-3xl font-display uppercase tracking-tight text-foreground mb-8">
                Categories
              </h2>
              {categories.length === 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-48 animate-pulse rounded-lg border bg-muted" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {categories.map((cat, i) => (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={`/categories/${cat.slug}`}
                        className="group block rounded-lg border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all"
                      >
                        {/* Placeholder image */}
                        <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                          {cat.image_url ? (
                            <img src={cat.image_url} alt={catName(cat)} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-muted-foreground/30 text-4xl">📦</div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {catName(cat)}
                          </h3>
                          {catDesc(cat) && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                              {catDesc(cat)}
                            </p>
                          )}
                          <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                            {lang === 'it' ? 'Scopri di più' : 'Discover more'} <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Shared sections */}
      <SpeakWithUs />
      <ShippingSecurity />
    </>
  );
};

export default Index;
