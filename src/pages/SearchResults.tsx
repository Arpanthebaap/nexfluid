import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Search, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

type Product = {
  id: string;
  product_code: string;
  name_it: string;
  name_en: string;
  slug: string;
  brand: string | null;
  images: any;
};

const PAGE_SIZE = 30;

const SearchResults = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'it' | 'en';
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const search = async () => {
      if (!query.trim()) { setProducts([]); setTotalCount(0); setLoading(false); return; }
      setLoading(true);

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const baseQuery = supabase
        .from('products')
        .select('id, product_code, name_it, name_en, slug, brand, images', { count: 'exact' })
        .or(`product_code.ilike.%${query}%,name_it.ilike.%${query}%,name_en.ilike.%${query}%`)
        .eq('is_active', true)
        .eq('status', 'published')
        .range(from, to);

      const { data, count } = await baseQuery;

      setProducts(data || []);
      setTotalCount(count || 0);
      setLoading(false);
    };
    search();
  }, [query, page]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(p));
    setSearchParams(params);
    window.scrollTo(0, 0);
  };

  return (
    <div className="py-12 md:py-16">
      <Helmet>
        <title>{`"${query}" — ${lang === 'it' ? 'Risultati ricerca' : 'Search results'} | Nexfluid`}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl font-display uppercase text-primary">
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
              {t('search.showing')} {totalCount} {t('search.products')}
              {totalPages > 1 && ` — ${lang === 'it' ? 'Pagina' : 'Page'} ${page}/${totalPages}`}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {lang === 'it' ? 'Precedente' : 'Previous'}
                </Button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 5) {
                    p = i + 1;
                  } else if (page <= 3) {
                    p = i + 1;
                  } else if (page >= totalPages - 2) {
                    p = totalPages - 4 + i;
                  } else {
                    p = page - 2 + i;
                  }
                  return (
                    <Button
                      key={p}
                      variant={p === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => goToPage(p)}
                      className="min-w-[36px]"
                    >
                      {p}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                  className="gap-1"
                >
                  {lang === 'it' ? 'Successiva' : 'Next'}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
