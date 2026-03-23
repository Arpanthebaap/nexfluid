import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, FolderOpen, Package, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

type Product = {
  id: string;
  product_code: string;
  name_it: string;
  name_en: string;
  slug: string;
  brand: string | null;
  images: any;
};

const PAGE_SIZE = 10;

const Categories = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'it' | 'en';
  const { slug } = useParams();
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Product listing state (for leaf categories)
  const [isLeaf, setIsLeaf] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [productsLoading, setProductsLoading] = useState(false);

  // Build breadcrumb hierarchy
  const buildBreadcrumbs = async (cat: Category) => {
    const chain: Category[] = [];
    let current: Category | null = cat;

    // Walk up parent chain (max 10 levels to prevent infinite loop)
    let depth = 0;
    while (current && depth < 10) {
      chain.unshift(current);
      if (!current.parent_id) break;
      const { data } = await supabase.
      from('categories').
      select('id, slug, name_it, name_en, description_it, description_en, image_url, parent_id').
      eq('id', current.parent_id).
      single();
      current = data as Category | null;
      depth++;
    }
    setBreadcrumbs(chain);
  };

  // Fetch products for leaf category
  const fetchProducts = async (categoryId: string) => {
    setProductsLoading(true);

    const { count } = await supabase.
    from('products').
    select('id', { count: 'exact', head: true }).
    eq('category_id', categoryId).
    eq('is_active', true).
    eq('status', 'published');

    setTotalCount(count || 0);

    let query = supabase.
    from('products').
    select('id, product_code, name_it, name_en, slug, brand, images').
    eq('category_id', categoryId).
    eq('is_active', true).
    eq('status', 'published').
    range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (sortBy === 'name') query = query.order('name_en');else
    if (sortBy === 'code') query = query.order('product_code');else
    query = query.order('created_at', { ascending: false });

    const { data } = await query;
    setProducts(data || []);
    setProductsLoading(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setIsLeaf(false);
      setProducts([]);
      setPage(0);

      if (slug) {
        const { data: cat } = await supabase.
        from('categories').
        select('id, slug, name_it, name_en, description_it, description_en, image_url, parent_id').
        eq('slug', slug).
        eq('is_active', true).
        single();

        setCurrentCategory(cat as Category | null);

        if (cat) {
          await buildBreadcrumbs(cat as Category);

          const { data: subs } = await supabase.
          from('categories').
          select('id, slug, name_it, name_en, description_it, description_en, image_url, parent_id').
          eq('parent_id', cat.id).
          eq('is_active', true).
          order('sort_order');

          const subList = (subs || []) as Category[];
          setSubcategories(subList);

          if (subList.length === 0) {
            setIsLeaf(true);
            await fetchProducts(cat.id);
          }
        }
      } else {
        const { data } = await supabase.
        from('categories').
        select('id, slug, name_it, name_en, description_it, description_en, image_url, parent_id').
        eq('is_active', true).
        is('parent_id', null).
        order('sort_order');
        setSubcategories((data || []) as Category[]);
        setCurrentCategory(null);
        setBreadcrumbs([]);
      }

      setLoading(false);
    };
    fetchData();
  }, [slug]);

  // Re-fetch products when page or sort changes (only for leaf categories)
  useEffect(() => {
    if (isLeaf && currentCategory) {
      fetchProducts(currentCategory.id);
    }
  }, [page, sortBy]);

  const catName = (cat: Category) => lang === 'it' ? cat.name_it : cat.name_en;
  const catDesc = (cat: Category) => lang === 'it' ? cat.description_it : cat.description_en;
  const title = currentCategory ? catName(currentCategory) : t('categories.title');

  const updateQty = (id: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta)
    }));
  };

  const getProductImage = (product: Product): string | null => {
    if (!product.images) return null;
    const imgs = Array.isArray(product.images) ? product.images : [];
    if (imgs.length > 0 && typeof imgs[0] === 'string') return imgs[0];
    return null;
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (page > 2) pages.push('ellipsis');
      for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 3) pages.push('ellipsis');
      pages.push(totalPages - 1);
    }
    return pages;
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto">
          <Link to="/" className="hover:text-primary shrink-0">Home</Link>
          {breadcrumbs.map((bc, i) =>
          <span key={bc.id} className="flex items-center gap-1 shrink-0">
              <ChevronRight className="h-3 w-3" />
              {i < breadcrumbs.length - 1 ?
            <Link to={`/categories/${bc.slug}`} className="hover:text-primary">
                  {catName(bc)}
                </Link> :

            <span className="text-foreground font-medium">{catName(bc)}</span>
            }
            </span>
          )}
          {!currentCategory && !slug &&
          <span className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{t('categories.title')}</span>
            </span>
          }
        </nav>

        <div className="flex gap-8">
          <BrandsSidebar />

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl font-display uppercase">
                  {title}
                </h1>
                {isLeaf && !loading &&
                <p className="text-sm text-muted-foreground mt-1">
                    {lang === 'it' ?
                  `Ci sono ${totalCount}+ prodotti` :
                  `There are ${totalCount}+ products`}
                  </p>
                }
              </div>
              {isLeaf &&
              <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    {lang === 'it' ? 'Ordina per' : 'Sort by'}
                  </span>
                  <Select value={sortBy} onValueChange={(v) => {setSortBy(v);setPage(0);}}>
                    <SelectTrigger className="w-36 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">{lang === 'it' ? 'Rilevanza' : 'Relevance'}</SelectItem>
                      <SelectItem value="name">{lang === 'it' ? 'Nome' : 'Name'}</SelectItem>
                      <SelectItem value="code">{lang === 'it' ? 'Codice' : 'Code'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              }
            </div>

            {loading ?
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) =>
              <div key={i} className="h-48 animate-pulse rounded-lg border bg-muted" />
              )}
              </div> :
            isLeaf ? (
            /* ====== PRODUCT LISTING (leaf category) ====== */
            productsLoading ?
            <div className="space-y-3">
                  {[...Array(5)].map((_, i) =>
              <div key={i} className="h-28 animate-pulse rounded-lg border bg-muted" />
              )}
                </div> :
            products.length === 0 ?
            <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    {lang === 'it' ? 'Nessun prodotto trovato.' : 'No products found.'}
                  </p>
                </div> :

            <>
                  <div className="space-y-3">
                    {products.map((product, i) => {
                  const qty = quantities[product.id] || 1;
                  const imgUrl = getProductImage(product);
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
                      
                          {/* Product image */}
                          <Link to={`/products/${product.slug}`} className="shrink-0">
                            <div className="h-[120px] w-[120px] rounded border bg-muted/50 flex items-center justify-center overflow-hidden">
                              {imgUrl ?
                          <img
                            src={imgUrl}
                            alt={lang === 'it' ? product.name_it : product.name_en}
                            className="h-full w-full object-contain p-2"
                            loading="lazy" /> :


                          <Package className="h-10 w-10 text-muted-foreground/30" />
                          }
                            </div>
                          </Link>

                          {/* Product info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground font-mono">
                              {product.brand && <span className="font-semibold">{product.brand}</span>}
                              {product.brand && ' · '}
                              {product.product_code}
                            </p>
                            <Link to={`/products/${product.slug}`}>
                              <h3 className="font-semibold transition-colors mt-0.5 line-clamp-2 text-primary">
                                {lang === 'it' ? product.name_it : product.name_en}
                              </h3>
                            </Link>
                          </div>

                          {/* Qty + Quote */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center border rounded-md overflow-hidden">
                              <button
                            onClick={() => updateQty(product.id, -1)}
                            className="px-2.5 py-1.5 text-sm hover:bg-muted transition-colors active:scale-95">
                            
                                −
                              </button>
                              <span className="px-3 py-1.5 text-sm font-medium border-x tabular-nums min-w-[2.5rem] text-center">
                                {qty}
                              </span>
                              <button
                            onClick={() => updateQty(product.id, 1)}
                            className="px-2.5 py-1.5 text-sm hover:bg-muted transition-colors active:scale-95">
                            
                                +
                              </button>
                            </div>
                            <Button
                          asChild
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground uppercase text-xs font-bold tracking-wider px-4">
                          
                              <Link to={`/contact?product=${product.product_code}&qty=${qty}`}>
                                {lang === 'it' ? 'Richiedi Preventivo' : 'Request a Quote'}
                              </Link>
                            </Button>
                          </div>
                        </motion.div>);

                })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 &&
              <div className="mt-8 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {lang === 'it' ?
                  `Elementi ${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, totalCount)} di ${totalCount}` :
                  `Items ${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, totalCount)} of ${totalCount} items`}
                      </span>
                      <div className="flex items-center gap-1">
                        {getPageNumbers().map((p, i) =>
                  p === 'ellipsis' ?
                  <span key={`e${i}`} className="px-1 text-muted-foreground">…</span> :

                  <Button
                    key={p}
                    variant={page === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(p)}
                    className="w-8 h-8 p-0 text-xs">
                    
                              {p + 1}
                            </Button>

                  )}
                        <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="ml-1 gap-1">
                    
                          {lang === 'it' ? 'Succ.' : 'Next'}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
              }
                </>) :

            subcategories.length === 0 ? (
            /* ====== EMPTY STATE ====== */
            <div className="mt-12 text-center">
                <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  {lang === 'it' ? 'Nessuna sottocategoria trovata.' : 'No subcategories found.'}
                </p>
              </div>) : (

            /* ====== SUBCATEGORY GRID ====== */
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {subcategories.map((cat, i) =>
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}>
                
                    <Link
                  to={`/categories/${cat.slug}`}
                  className="group block rounded-lg border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all">
                  
                      <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                        {cat.image_url || currentCategory?.image_url ?
                    <img src={cat.image_url || currentCategory?.image_url || ''} alt={catName(cat)} className="w-full h-full object-cover" /> :

                    <div className="text-muted-foreground/30 text-4xl">📦</div>
                    }
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {catName(cat)}
                        </h3>
                        {catDesc(cat) &&
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{catDesc(cat)}</p>
                    }
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                          {lang === 'it' ? 'Scopri di più' : 'Discover more'} <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
              )}
              </div>)
            }
          </div>
        </div>
      </div>

      <SpeakWithUs />
      <ShippingSecurity />
    </>);

};

export default Categories;