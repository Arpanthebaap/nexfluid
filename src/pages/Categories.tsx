import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronRight, FolderOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

const Categories = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'it' | 'en';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .is('parent_id', null)
        .order('sort_order');
      setCategories(data || []);
      setLoading(false);
    };
    fetchCategories();
  }, []);

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl font-['Space_Grotesk']">
          {t('categories.title')}
        </h1>
        <p className="mt-2 text-muted-foreground">{t('categories.subtitle')}</p>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg border bg-muted" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="mt-12 text-center">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              {lang === 'it' ? 'Categorie in arrivo. Stiamo costruendo il catalogo.' : 'Categories coming soon. We are building the catalog.'}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/categories/${cat.slug}`}
                  className="group flex items-center gap-4 rounded-lg border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FolderOpen className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                      {lang === 'it' ? cat.name_it : cat.name_en}
                    </h3>
                    {(lang === 'it' ? cat.description_it : cat.description_en) && (
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                        {lang === 'it' ? cat.description_it : cat.description_en}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;
