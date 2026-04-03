import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BrandsSidebar from '@/components/shared/BrandsSidebar';
import BrandedProductImage from '@/components/shared/BrandedProductImage';
import SpeakWithUs from '@/components/shared/SpeakWithUs';
import ShippingSecurity from '@/components/shared/ShippingSecurity';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage
} from '@/components/ui/breadcrumb';

type Category = {
  id: string;
  slug: string;
  name_it: string;
  name_en: string;
  parent_id: string | null;
  image_url: string | null;
};

type CategoryWithCount = Category & { count: number };

type Product = {
  id: string;
  product_code: string;
  name_it: string;
  name_en: string;
  slug: string;
  brand: string | null;
  images: any;
  description_it: string | null;
  description_en: string | null;
};

const PAGE_SIZE = 10;

const BrandPage = () => {
  const { brandName, slug } = useParams();
  const { i18n } = useTranslation();
  const lang = i18n.language as 'it' | 'en';
  const brand = brandName?.toUpperCase() || '';

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [brandCounts, setBrandCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  // Product listing state (when at leaf category)
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showProducts, setShowProducts] = useState(false);

  // Breadcrumb state
  const [breadcrumbs, setBreadcrumbs] = useState<Category[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [categoryImageUrl, setCategoryImageUrl] = useState<string | null>(null);

  const catName = (cat: Category) => lang === 'it' ? cat.name_it : cat.name_en;

  // Fetch all categories and brand counts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [{ data: cats }, { data: counts }] = await Promise.all([
        supabase.from('categories').select('id, slug, name_it, name_en, parent_id, image_url').eq('is_active', true).order('sort_order'),
        supabase.rpc('get_brand_category_counts', { _brand: brand }),
      ]);

      setAllCategories(cats || []);

      const countMap = new Map<string, number>();
      if (counts) {
        (counts as any[]).forEach((r: any) => countMap.set(r.category_id, Number(r.product_count)));
      }
      setBrandCounts(countMap);
      setLoading(false);
    };
    fetchData();
  }, [brand]);

  // Resolve current view based on slug
  useEffect(() => {
    if (allCategories.length === 0 || brandCounts.size === 0) return;

    if (!slug) {
      setCurrentCategory(null);
      setBreadcrumbs([]);
      setShowProducts(false);
      return;
    }

    const cat = allCategories.find(c => c.slug === slug);
    if (!cat) return;

    setCurrentCategory(cat);

    // Build breadcrumb chain
    const chain: Category[] = [];
    let current: Category | undefined = cat;
    while (current) {
      chain.unshift(current);
      current = allCategories.find(c => c.id === current!.parent_id);
    }
    setBreadcrumbs(chain);

    // Check if this category has subcategories with brand products
    const children = allCategories.filter(c => c.parent_id === cat.id);
    const childrenWithProducts = children.filter(c => getCategoryProductCount(c.id, allCategories, brandCounts) > 0);

    if (childrenWithProducts.length > 0) {
      setShowProducts(false);
    } else {
      // Leaf category — show products
      setShowProducts(true);
      setPage(0);
    }

    // Find category image (walk up tree)
    let imgCat: Category | undefined = cat;
    let imgUrl: string | null = null;
    while (imgCat && !imgUrl) {
      imgUrl = imgCat.image_url;
      imgCat = allCategories.find(c => c.id === imgCat!.parent_id);
    }
    setCategoryImageUrl(imgUrl);
  }, [slug, allCategories, brandCounts]);

  // Fetch products when showing product list
  useEffect(() => {
    if (!showProducts || !currentCategory) return;

    const fetchProducts = async () => {
      setLoading(true);

      // Get all descendant category IDs (current + all children recursively)
      const catIds = getDescendantIds(currentCategory.id, allCategories);

      let query = supabase
        .from('products')
        .select('id, product_code, name_it, name_en, slug, brand, images, description_it, description_en', { count: 'exact' })
        .eq('is_active', true)
        .eq('status', 'published')
        .ilike('brand', brand)
        .in('category_id', catIds);

      if (sortBy === 'name_asc') query = query.order('name_en', { ascending: true });
      else if (sortBy === 'name_desc') query = query.order('name_en', { ascending: false });
      else if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
      else query = query.order('product_code', { ascending: true });

      query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      const { data, count } = await query;
      setProducts(data || []);
      setTotalCount(count || 0);
      setLoading(false);
    };
    fetchProducts();
  }, [showProducts, currentCategory, page, sortBy, brand, allCategories]);

  // Get total product count for a category including all descendants
  function getCategoryProductCount(catId: string, cats: Category[], counts: Map<string, number>): number {
    let total = counts.get(catId) || 0;
    const children = cats.filter(c => c.parent_id === catId);
    for (const child of children) {
      total += getCategoryProductCount(child.id, cats, counts);
    }
    return total;
  }

  function getDescendantIds(catId: string, cats: Category[]): string[] {
    const ids = [catId];
    const children = cats.filter(c => c.parent_id === catId);
    for (const child of children) {
      ids.push(...getDescendantIds(child.id, cats));
    }
    return ids;
  }

  // Determine which categories to display
  const displayCategories = (): CategoryWithCount[] => {
    const parentId = currentCategory?.id || null;
    let cats: Category[];

    if (!parentId) {
      // Show top-level categories
      cats = allCategories.filter(c => !c.parent_id);
    } else {
      cats = allCategories.filter(c => c.parent_id === parentId);
    }

    return cats
      .map(c => ({ ...c, count: getCategoryProductCount(c.id, allCategories, brandCounts) }))
      .filter(c => c.count > 0);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const prodName = (p: Product) => lang === 'it' ? p.name_it : p.name_en;
  const prodDesc = (p: Product) => lang === 'it' ? p.description_it : p.description_en;

  const handleQuantity = (id: string, delta: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + delta) }));
  };

  return (
    <>
      <Helmet>
        <title>{`${brand}${currentCategory ? ` — ${catName(currentCategory)}` : ''} | Nexfluid`}</title>
        <meta name="description" content={`${lang === 'it' ? 'Scopri i prodotti' : 'Discover products from'} ${brand}${currentCategory ? ` - ${catName(currentCategory)}` : ''}`} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {breadcrumbs.length === 0 ? (
              <BreadcrumbItem><BreadcrumbPage>{brand}</BreadcrumbPage></BreadcrumbItem>
            ) : (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link to={`/brands/${brandName}`}>{brand}</Link></BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((bc, i) => (
                  <span key={bc.id} className="contents">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {i === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage>{catName(bc)}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={`/brands/${brandName}/${bc.slug}`}>{catName(bc)}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </span>
                ))}
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex gap-8">
          <BrandsSidebar />

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold font-display uppercase tracking-tight text-foreground mb-6">
              {currentCategory ? `${brand} — ${catName(currentCategory)}` : brand}
            </h1>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-40 animate-pulse bg-muted rounded-lg" />
                ))}
              </div>
            ) : showProducts && currentCategory ? (
              /* Product listing */
              <>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">
                    {totalCount} {totalCount === 1 ? (lang === 'it' ? 'prodotto' : 'product') : (lang === 'it' ? 'prodotti' : 'products')}
                  </span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">{lang === 'it' ? 'Rilevanza' : 'Relevance'}</SelectItem>
                      <SelectItem value="name_asc">{lang === 'it' ? 'Nome A–Z' : 'Name A–Z'}</SelectItem>
                      <SelectItem value="name_desc">{lang === 'it' ? 'Nome Z–A' : 'Name Z–A'}</SelectItem>
                      <SelectItem value="newest">{lang === 'it' ? 'Più recenti' : 'Newest'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">
                      {lang === 'it' ? 'Nessun prodotto trovato.' : 'No products found.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products.map(product => {
                      const qty = quantities[product.id] || 1;
                      const imgs = Array.isArray(product.images) ? product.images : [];
                      return (
                        <div key={product.id} className="flex items-center gap-4 rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
                          <Link to={`/products/${product.slug}`} className="shrink-0 w-20 h-20 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                            <BrandedProductImage
                              src={imgs.length > 0 ? imgs[0] : null}
                              alt={prodName(product)}
                              productCode={product.product_code}
                              brand={product.brand}
                              size="sm"
                              categoryImageUrl={categoryImageUrl}
                            />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link to={`/products/${product.slug}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-1">
                              {prodName(product)}
                            </Link>
                            <p className="text-xs text-muted-foreground mt-0.5">{product.product_code}</p>
                            {prodDesc(product) && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{prodDesc(product)}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center border rounded-md">
                              <button onClick={() => handleQuantity(product.id, -1)} className="px-2 py-1 text-sm hover:bg-muted transition-colors">−</button>
                              <span className="px-2 py-1 text-sm min-w-[2rem] text-center">{qty}</span>
                              <button onClick={() => handleQuantity(product.id, 1)} className="px-2 py-1 text-sm hover:bg-muted transition-colors">+</button>
                            </div>
                            <Button size="sm" asChild>
                              <Link to={`/products/${product.slug}`}>
                                {lang === 'it' ? 'Richiedi Preventivo' : 'Request a Quote'}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {page + 1} / {totalPages}
                    </span>
                    <Button variant="outline" size="icon" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              /* Category grid */
              (() => {
                const cats = displayCategories();
                return cats.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">
                      {lang === 'it' ? 'Nessun prodotto trovato per questo brand.' : 'No products found for this brand.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {cats.map(cat => (
                      <Link
                        key={cat.id}
                        to={`/brands/${brandName}/${cat.slug}`}
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
                );
              })()
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
