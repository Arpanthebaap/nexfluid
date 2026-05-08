import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowRight, FolderOpen, Package, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import BrandsSidebar from '@/components/shared/BrandsSidebar';
import BrandedProductImage from '@/components/shared/BrandedProductImage';
import CategoryFilters, { FilterState, emptyFilters } from '@/components/shared/CategoryFilters';
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

type Product = {
  id: string;
  product_code: string;
  name_it: string;
  name_en: string;
  slug: string;
  brand: string | null;
  images: any;
};

const SORT_OPTIONS: { value: string; it: string; en: string }[] = [
  { value: 'relevance', it: 'Rilevanza', en: 'Relevance' },
  { value: 'code_asc', it: 'Codice A → Z', en: 'Code A → Z' },
  { value: 'code_desc', it: 'Codice Z → A', en: 'Code Z → A' },
  { value: 'name_asc', it: 'Nome A → Z', en: 'Name A → Z' },
  { value: 'brand_asc', it: 'Marca A → Z', en: 'Brand A → Z' },
  { value: 'recent', it: 'Più recenti', en: 'Recently added' },
];

const PAGE_SIZES = [10, 25, 50];

// Encode/decode filters via URL search params (compact JSON)
const encodeFilters = (f: FilterState): string => {
  if (f.brand.length === 0 && Object.keys(f.attributes).length === 0 && Object.keys(f.ranges).length === 0) return '';
  return btoa(unescape(encodeURIComponent(JSON.stringify(f))));
};
const decodeFilters = (s: string | null): FilterState => {
  if (!s) return emptyFilters;
  try { return JSON.parse(decodeURIComponent(escape(atob(s)))) as FilterState; } catch { return emptyFilters; }
};

const Categories = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'it' | 'en';
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [isLeaf, setIsLeaf] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [productsLoading, setProductsLoading] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Resolved nearest-ancestor image for the current category (used as product image fallback)
  const resolvedCategoryImage = useMemo(() => {
    for (let i = breadcrumbs.length - 1; i >= 0; i--) {
      if (breadcrumbs[i].image_url) return breadcrumbs[i].image_url!;
    }
    return currentCategory?.image_url || null;
  }, [breadcrumbs, currentCategory]);

  const currentCategoryName = currentCategory
    ? (lang === 'it' ? currentCategory.name_it : currentCategory.name_en)
    : undefined;

  // URL-synced state
  const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10));
  const sortBy = searchParams.get('sort') || 'relevance';
  const pageSize = parseInt(searchParams.get('size') || '10', 10);
  const filters = useMemo(() => decodeFilters(searchParams.get('f')), [searchParams]);

  const updateParams = (mut: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams);
    mut(next);
    setSearchParams(next, { replace: false });
  };

  const setPage = (p: number) => updateParams(np => { if (p === 0) np.delete('page'); else np.set('page', String(p)); });
  const setSortBy = (s: string) => updateParams(np => { s === 'relevance' ? np.delete('sort') : np.set('sort', s); np.delete('page'); });
  const setPageSize = (n: number) => updateParams(np => { n === 10 ? np.delete('size') : np.set('size', String(n)); np.delete('page'); });
  const setFilters = (f: FilterState) => updateParams(np => { const enc = encodeFilters(f); enc ? np.set('f', enc) : np.delete('f'); np.delete('page'); });

  const buildBreadcrumbs = async (cat: Category) => {
    const chain: Category[] = [];
    let current: Category | null = cat;
    let depth = 0;
    while (current && depth < 10) {
      chain.unshift(current);
      if (!current.parent_id) break;
      const { data } = await supabase
        .from('categories')
        .select('id, slug, name_it, name_en, description_it, description_en, image_url, parent_id')
        .eq('id', current.parent_id)
        .single();
      current = data as Category | null;
      depth++;
    }
    setBreadcrumbs(chain);
  };

  // Initial category load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setIsLeaf(false);
      setProducts([]);

      if (slug) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id, slug, name_it, name_en, description_it, description_en, image_url, parent_id')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        setCurrentCategory(cat as Category | null);

        if (cat) {
          await buildBreadcrumbs(cat as Category);
          const { data: subs } = await supabase
            .from('categories')
            .select('id, slug, name_it, name_en, description_it, description_en, image_url, parent_id')
            .eq('parent_id', cat.id)
            .eq('is_active', true)
            .order('sort_order');
          const subList = (subs || []) as Category[];
          setSubcategories(subList);
          if (subList.length === 0) setIsLeaf(true);
        }
      } else {
        const { data } = await supabase
          .from('categories')
          .select('id, slug, name_it, name_en, description_it, description_en, image_url, parent_id')
          .eq('is_active', true)
          .is('parent_id', null)
          .order('sort_order');
        setSubcategories((data || []) as Category[]);
        setCurrentCategory(null);
        setBreadcrumbs([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [slug]);

  // Fetch products via RPC whenever leaf state, filters, sort, page, or pageSize change
  useEffect(() => {
    if (!isLeaf || !currentCategory) return;
    const fetchProducts = async () => {
      setProductsLoading(true);
      const { data, error } = await supabase.rpc('filter_products', {
        _category_id: currentCategory.id,
        _filters: filters as any,
        _sort: sortBy,
        _lang: lang,
        _page: page,
        _page_size: pageSize,
      });
      if (error) {
        console.error('filter_products error', error);
        setProducts([]);
        setTotalCount(0);
      } else {
        const rows = (data || []) as any[];
        setProducts(rows.map(r => ({
          id: r.id, product_code: r.product_code, name_it: r.name_it, name_en: r.name_en,
          slug: r.slug, brand: r.brand, images: r.images,
        })));
        setTotalCount(rows.length > 0 ? Number(rows[0].total_count) : 0);
      }
      setProductsLoading(false);
    };
    fetchProducts();
  }, [isLeaf, currentCategory, filters, sortBy, page, pageSize, lang]);

  const catName = (cat: Category) => lang === 'it' ? cat.name_it : cat.name_en;
  const catDesc = (cat: Category) => lang === 'it' ? cat.description_it : cat.description_en;
  const title = currentCategory ? catName(currentCategory) : t('categories.title');

  const updateQty = (id: string, delta: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + delta) }));
  };

  const getProductImage = (product: Product): string | null => {
    if (!product.images) return null;
    const imgs = Array.isArray(product.images) ? product.images : [];
    if (imgs.length > 0 && typeof imgs[0] === 'string') return imgs[0];
    if (imgs.length > 0 && typeof imgs[0] === 'object' && imgs[0]?.url) return imgs[0].url;
    return null;
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) { for (let i = 0; i < totalPages; i++) pages.push(i); }
    else {
      pages.push(0);
      if (page > 2) pages.push('ellipsis');
      for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) pages.push(i);
      if (page < totalPages - 3) pages.push('ellipsis');
      pages.push(totalPages - 1);
    }
    return pages;
  };

  // Active filter chip count
  const activeFilterCount = useMemo(() => {
    let c = filters.brand.length;
    Object.values(filters.attributes).forEach(v => c += v.length);
    if (filters.ranges.working_pressure) c += 1;
    if (filters.ranges.ambient_temp) c += 1;
    return c;
  }, [filters]);

  const removeChip = (mut: (f: FilterState) => FilterState) => setFilters(mut(filters));

  const metaTitle = currentCategory
    ? `${catName(currentCategory)} | Nexfluid`
    : (lang === 'it' ? 'Categorie Prodotti | Nexfluid' : 'Product Categories | Nexfluid');

  return (
    <>
      <Helmet>
        <html lang={lang} />
        <title>{metaTitle}</title>
        {currentCategory && (
          <meta name="description" content={catDesc(currentCategory) || `${catName(currentCategory)} — ${lang === 'it' ? 'Prodotti industriali su Nexfluid' : 'Industrial products at Nexfluid'}`} />
        )}
        <link rel="canonical" href={`https://nexfluid.${lang === 'en' ? 'com' : 'it'}${slug ? `/categories/${slug}` : '/categories'}`} />
        <link rel="alternate" hrefLang="it" href={`https://nexfluid.it${slug ? `/categories/${slug}` : '/categories'}`} />
        <link rel="alternate" hrefLang="en" href={`https://nexfluid.com${slug ? `/categories/${slug}` : '/categories'}`} />
        <link rel="alternate" hrefLang="x-default" href={`https://nexfluid.it${slug ? `/categories/${slug}` : '/categories'}`} />
      </Helmet>
      <div className="container mx-auto px-4 py-6 sm:py-8 pb-24">
        {/* Breadcrumbs — scrollable on mobile to prevent overflow pushing layout */}
        <nav className="mb-4 -mx-4 px-4 overflow-x-auto whitespace-nowrap">
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary shrink-0">Home</Link>
            {breadcrumbs.map((bc, i) => (
              <span key={bc.id} className="flex items-center gap-1 shrink-0">
                <ChevronRight className="h-3 w-3" />
                {i < breadcrumbs.length - 1
                  ? <Link to={`/categories/${bc.slug}`} className="hover:text-primary">{catName(bc)}</Link>
                  : <span className="text-foreground font-medium">{catName(bc)}</span>}
              </span>
            ))}
            {!currentCategory && !slug && (
              <span className="flex items-center gap-1 shrink-0">
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground font-medium">{t('categories.title')}</span>
              </span>
            )}
          </div>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            {isLeaf && currentCategory ? (
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
                <CategoryFilters categoryId={currentCategory.id} filters={filters} onChange={setFilters} />
              </div>
            ) : (
              <BrandsSidebar />
            )}
          </aside>

          <div className="flex-1 min-w-0">
            {/* Header — stacks vertically on mobile so the H1 doesn't get crushed by the sort */}
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight font-display uppercase text-primary break-words">
                {title}
              </h1>
              {isLeaf && !loading && (
                <p className="text-sm text-muted-foreground mt-1">
                  {lang === 'it' ? `${totalCount} prodotti` : `${totalCount} products`}
                </p>
              )}

              {isLeaf && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {/* Mobile filter trigger */}
                  <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="lg:hidden gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        {lang === 'it' ? 'Filtri' : 'Filters'}
                        {activeFilterCount > 0 && (
                          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">{activeFilterCount}</span>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto">
                      {currentCategory && (
                        <div className="pt-4">
                          <CategoryFilters
                            categoryId={currentCategory.id}
                            filters={filters}
                            onChange={setFilters}
                            onClose={() => setDrawerOpen(false)}
                          />
                        </div>
                      )}
                    </SheetContent>
                  </Sheet>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-9 text-sm w-full sm:w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{lang === 'it' ? o.it : o.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={String(pageSize)} onValueChange={(v) => setPageSize(parseInt(v, 10))}>
                    <SelectTrigger className="h-9 text-sm w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map(n => (<SelectItem key={n} value={String(n)}>{n} / {lang === 'it' ? 'pag.' : 'page'}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Active filter chips */}
              {isLeaf && activeFilterCount > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {filters.brand.map(b => (
                    <Chip key={`b-${b}`} label={b} onRemove={() => removeChip(f => ({ ...f, brand: f.brand.filter(x => x !== b) }))} />
                  ))}
                  {Object.entries(filters.attributes).flatMap(([name, vals]) => vals.map(v => (
                    <Chip key={`${name}-${v}`} label={`${name}: ${v}`} onRemove={() => removeChip(f => {
                      const next = { ...f.attributes };
                      const arr = (next[name] || []).filter(x => x !== v);
                      if (arr.length === 0) delete next[name]; else next[name] = arr;
                      return { ...f, attributes: next };
                    })} />
                  )))}
                  {filters.ranges.working_pressure && (
                    <Chip label={`${filters.ranges.working_pressure.min}–${filters.ranges.working_pressure.max} bar`} onRemove={() => removeChip(f => { const r = { ...f.ranges }; delete r.working_pressure; return { ...f, ranges: r }; })} />
                  )}
                  {filters.ranges.ambient_temp && (
                    <Chip label={`${filters.ranges.ambient_temp.min}–${filters.ranges.ambient_temp.max} °C`} onRemove={() => removeChip(f => { const r = { ...f.ranges }; delete r.ambient_temp; return { ...f, ranges: r }; })} />
                  )}
                  <button onClick={() => setFilters(emptyFilters)} className="text-xs text-primary hover:underline ml-1">
                    {lang === 'it' ? 'Cancella tutto' : 'Clear all'}
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-48 animate-pulse rounded-lg border bg-muted" />)}
              </div>
            ) : isLeaf ? (
              productsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-lg border bg-muted" />)}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-card">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    {activeFilterCount > 0
                      ? (lang === 'it' ? 'Nessun prodotto corrisponde ai filtri selezionati.' : 'No products match the selected filters.')
                      : (lang === 'it' ? 'Nessun prodotto trovato.' : 'No products found.')}
                  </p>
                  {activeFilterCount > 0 && (
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setFilters(emptyFilters)}>
                      {lang === 'it' ? 'Cancella filtri' : 'Clear filters'}
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {products.map((product, i) => {
                      const qty = quantities[product.id] || 1;
                      const imgUrl = getProductImage(product);
                      return (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.3 }}
                          className="rounded-lg border bg-card p-3 sm:p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                            <Link to={`/products/${product.slug}`} className="shrink-0 self-center sm:self-auto">
                              <BrandedProductImage
                                src={imgUrl}
                                alt={`${product.product_code} ${lang === 'it' ? product.name_it : product.name_en}`}
                                productCode={product.product_code}
                                brand={product.brand}
                                categoryName={currentCategoryName}
                                categoryImageUrl={resolvedCategoryImage}
                                size="sm"
                                className="!h-[120px] !w-[120px]"
                              />
                            </Link>

                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground font-mono">
                                {product.brand && <span className="font-semibold">{product.brand}</span>}
                                {product.brand && ' · '}{product.product_code}
                              </p>
                              <Link to={`/products/${product.slug}`}>
                                <h3 className="font-semibold mt-0.5 line-clamp-2 text-primary hover:underline">
                                  {lang === 'it' ? product.name_it : product.name_en}
                                </h3>
                              </Link>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 sm:shrink-0 w-full sm:w-auto">
                              <div className="flex items-center border rounded-md overflow-hidden">
                                <button onClick={() => updateQty(product.id, -1)} className="px-2.5 py-1.5 text-sm hover:bg-muted active:scale-95">−</button>
                                <span className="px-3 py-1.5 text-sm font-medium border-x tabular-nums min-w-[2.5rem] text-center">{qty}</span>
                                <button onClick={() => updateQty(product.id, 1)} className="px-2.5 py-1.5 text-sm hover:bg-muted active:scale-95">+</button>
                              </div>
                              <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground uppercase text-xs font-bold tracking-wider px-3 sm:px-4">
                                <Link to={`/products/${product.slug}#quote-form`}>
                                  {lang === 'it' ? 'Richiedi un Preventivo' : 'REQUEST A Quote'}
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">
                        {lang === 'it'
                          ? `Elementi ${page * pageSize + 1}-${Math.min((page + 1) * pageSize, totalCount)} di ${totalCount}`
                          : `Items ${page * pageSize + 1}-${Math.min((page + 1) * pageSize, totalCount)} of ${totalCount}`}
                      </span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {getPageNumbers().map((p, i) =>
                          p === 'ellipsis'
                            ? <span key={`e${i}`} className="px-1 text-muted-foreground">…</span>
                            : <Button key={p} variant={page === p ? 'default' : 'outline'} size="sm" onClick={() => setPage(p)} className="w-8 h-8 p-0 text-xs">{p + 1}</Button>
                        )}
                        <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="ml-1 gap-1">
                          {lang === 'it' ? 'Succ.' : 'Next'}<ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )
            ) : subcategories.length === 0 ? (
              <div className="mt-12 text-center">
                <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  {lang === 'it' ? 'Nessuna sottocategoria trovata.' : 'No subcategories found.'}
                </p>
              </div>
            ) : (
              <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {subcategories.map((cat, i) => (
                  <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Link to={`/categories/${cat.slug}`} className="group block rounded-lg border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all">
                      <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                        {cat.image_url || currentCategory?.image_url
                          ? <img src={cat.image_url || currentCategory?.image_url || ''} alt={catName(cat)} className="w-full h-full object-cover" />
                          : <div className="text-muted-foreground/30 text-4xl">📦</div>}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{catName(cat)}</h3>
                        {catDesc(cat) && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{catDesc(cat)}</p>}
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

const Chip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-[11px] text-foreground">
    <span className="truncate max-w-[180px]">{label}</span>
    <button onClick={onRemove} className="hover:text-primary"><X className="h-3 w-3" /></button>
  </span>
);

export default Categories;
