import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Product = {
  id: string;
  product_code: string;
  name_it: string;
  name_en: string;
  slug: string;
  brand: string | null;
  images: any;
};

const SearchResults = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'it' | 'en';
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const search = async () => {
      if (!query.trim()) { setProducts([]); setLoading(false); return; }
      setLoading(true);

      const { data } = await supabase
        .from('products')
        .select('id, product_code, name_it, name_en, slug, brand, images')
        .or(`product_code.ilike.%${query}%,name_it.ilike.%${query}%,name_en.ilike.%${query}%`)
        .eq('is_active', true)
        .eq('status', 'published')
        .limit(50);

      setProducts(data || []);
      setLoading(false);
    };
    search();
  }, [query]);

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl font-['Space_Grotesk']">
          {t('search.results')}: "{query}"
        </h1>

        {loading ? (
          <div className="mt-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-12 text-center">
            <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">{t('search.noResults')}</p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('search.showing')} {products.length} {t('search.products')}
            </p>
            <div className="mt-6 space-y-3">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.slug}`}
                  className="group flex items-center gap-4 rounded-lg border bg-card p-4 hover:shadow-sm hover:border-primary/30 transition-all"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-muted">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-semibold text-primary">{product.product_code}</p>
                    <p className="text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {lang === 'it' ? product.name_it : product.name_en}
                    </p>
                  </div>
                  {product.brand && (
                    <span className="hidden text-xs text-muted-foreground sm:block">{product.brand}</span>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
