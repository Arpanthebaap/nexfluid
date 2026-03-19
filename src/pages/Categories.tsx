import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, FolderOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import BrandsSidebar from '@/components/shared/BrandsSidebar';
import SpeakWithUs from '@/components/shared/SpeakWithUs';
import ShippingSecurity from '@/components/shared/ShippingSecurity';

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
  const { slug } = useParams();
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      if (slug) {
        // Fetch current category
        const { data: cat } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        setCurrentCategory(cat);

        if (cat) {
          // Fetch subcategories
          const { data: subs } = await supabase
            .from('categories')
            .select('*')
            .eq('parent_id', cat.id)
            .eq('is_active', true)
            .order('sort_order');
          setSubcategories(subs || []);
        }
      } else {
        // Root categories
        const { data } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .is('parent_id', null)
          .order('sort_order');
        setSubcategories(data || []);
        setCurrentCategory(null);
      }

      setLoading(false);
    };
    fetchData();
  }, [slug]);

  const catName = (cat: Category) => lang === 'it' ? cat.name_it : cat.name_en;
  const catDesc = (cat: Category) => lang === 'it' ? cat.description_it : cat.description_en;

  const title = currentCategory ? catName(currentCategory) : t('categories.title');

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          {currentCategory && (
            <>
              <span className="mx-1">{'>'}</span>
              <span>{catName(currentCategory)}</span>
            </>
          )}
        </div>

        <div className="flex gap-8">
          <BrandsSidebar />

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl font-display uppercase">
              {title}
            </h1>

            {loading ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-48 animate-pulse rounded-lg border bg-muted" />
                ))}
              </div>
            ) : subcategories.length === 0 ? (
              <div className="mt-12 text-center">
                <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  {lang === 'it' ? 'Nessuna sottocategoria trovata.' : 'No subcategories found.'}
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {subcategories.map((cat, i) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={`/categories/${cat.slug}`}
                      className="group block rounded-lg border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all"
                    >
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
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{catDesc(cat)}</p>
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
          </div>
        </div>
      </div>

      <SpeakWithUs />
      <ShippingSecurity />
    </>
  );
};

export default Categories;
