import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import BrandsSidebar from '@/components/shared/BrandsSidebar';
import SpeakWithUs from '@/components/shared/SpeakWithUs';
import ShippingSecurity from '@/components/shared/ShippingSecurity';

type CategoryWithCount = {
  id: string;
  slug: string;
  name_it: string;
  name_en: string;
  parent_id: string | null;
  image_url: string | null;
  count: number;
};

const BrandPage = () => {
  const { brandName } = useParams();
  const { i18n } = useTranslation();
  const lang = i18n.language as 'it' | 'en';
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const brand = brandName?.toUpperCase() || '';

  useEffect(() => {
    const fetchBrandCategories = async () => {
      if (!brand) return;
      setLoading(true);

      // Get all products for this brand with their category_id
      const { data: products } = await supabase
        .from('products')
        .select('category_id')
        .eq('is_active', true)
        .ilike('brand', brand);

      if (!products || products.length === 0) {
        setLoading(false);
        return;
      }

      // Count products per category
      const countMap = new Map<string, number>();
      products.forEach(p => {
        if (p.category_id) {
          countMap.set(p.category_id, (countMap.get(p.category_id) || 0) + 1);
        }
      });

      // Fetch those categories
      const catIds = Array.from(countMap.keys());
      const { data: cats } = await supabase
        .from('categories')
        .select('id, slug, name_it, name_en, parent_id, image_url')
        .in('id', catIds)
        .eq('is_active', true)
        .order('sort_order');

      if (cats) {
        setCategories(
          cats.map(c => ({ ...c, count: countMap.get(c.id) || 0 }))
        );
      }

      setLoading(false);
    };
    fetchBrandCategories();
  }, [brand]);

  const catName = (cat: CategoryWithCount) => lang === 'it' ? cat.name_it : cat.name_en;

    return (
    <>
      <Helmet>
        <title>{`${brand} — ${lang === 'it' ? 'Prodotti' : 'Products'} | Nexfluid`}</title>
        <meta name="description" content={`${lang === 'it' ? 'Scopri i prodotti' : 'Discover products from'} ${brand} ${lang === 'it' ? 'disponibili su Nexfluid' : 'available at Nexfluid'}.`} />
      </Helmet>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-4 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-1">{'>'}</span>
          <span>{brand}</span>
        </div>

        <div className="flex gap-8">
          <BrandsSidebar />

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold font-display uppercase tracking-tight text-foreground mb-6">
              {brand}
            </h1>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-40 animate-pulse bg-muted rounded-lg" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-16">
                <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  {lang === 'it' ? 'Nessun prodotto trovato per questo brand.' : 'No products found for this brand.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map(cat => (
                  <Link
                    key={cat.id}
                    to={`/categories/${cat.slug}`}
                    className="group rounded-lg border bg-card p-4 hover:shadow-lg transition-shadow flex flex-col items-center text-center"
                  >
                    <div className="w-full aspect-square rounded-md bg-muted flex items-center justify-center mb-3 overflow-hidden">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={catName(cat)} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-10 w-10 text-muted-foreground/30" />
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {catName(cat)}
                    </h3>
                    <span className="text-xs text-muted-foreground mt-1">
                      {cat.count} {cat.count === 1 ? (lang === 'it' ? 'prodotto' : 'product') : (lang === 'it' ? 'prodotti' : 'products')}
                    </span>
                  </Link>
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

export default BrandPage;
