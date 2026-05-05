import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Package, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
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
  category_id: string | null;
};

const PAGE_SIZE = 10;

const BrandPage = () => {
  const { brandName, slug } = useParams();
  const { i18n } = useTranslation();
  const lang = i18n.language as 'it' | 'en';
  const brand = brandName?.toUpperCase() || '';

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [brandCounts, setBrandCounts] = useState<Map<string, number>>(new Map());
  const [totalBrandCount, setTotalBrandCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Product listing state
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

  const isAllProducts = slug === 'all';
  const catName = (cat: Category) => lang === 'it' ? cat.name_it : cat.name_en;

  // Fetch all categories, brand counts, and total brand product count
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [{ data: cats }, { data: counts }, { count: total }] = await Promise.all([
        supabase.from('categories').select('id, slug, name_it, name_en, parent_id, image_url').eq('is_active', true).order('sort_order'),
        supabase.rpc('get_brand_category_counts', { _brand: brand }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('status', 'published').contains('brands', [brand]),
      ]);

      setAllCategories(cats || []);
      setTotalBrandCount(total || 0);

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
    if (allCategories.length === 0 && !isAllProducts) return;

    if (isAllProducts) {
      setCurrentCategory(null);
      setBreadcrumbs([]);
      setShowProducts(true);
      setPage(0);
      return;
    }

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
  }, [slug, allCategories, brandCounts, isAllProducts]);

  // Fetch products when showing product list
  useEffect(() => {
    if (!showProducts) return;
    // For "all" view OR leaf category
    if (!isAllProducts && !currentCategory) return;

    const fetchProducts = async () => {
      setLoading(true);

      let query = supabase
        .from('products')
        .select('id, product_code, name_it, name_en, slug, brand, images, description_it, description_en, category_id', { count: 'exact' })
        .eq('is_active', true)
        .eq('status', 'published')
        .contains('brands', [brand]);

      // If viewing a specific category, filter by descendant IDs
      if (!isAllProducts && currentCategory) {
        const catIds = getDescendantIds(currentCategory.id, allCategories);
        query = query.in('category_id', catIds);
      }

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
  }, [showProducts, currentCategory, isAllProducts, page, sortBy, brand, allCategories]);

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

  // Walk up the category tree to find the nearest image (end-category fallback)
  const resolveCategoryImage = (categoryId: string | null): string | null => {
    if (!categoryId) return null;
    let cur = allCategories.find(c => c.id === categoryId);
    let depth = 0;
    while (cur && depth < 10) {
      if (cur.image_url) return cur.image_url;
      cur = cur.parent_id ? allCategories.find(c => c.id === cur!.parent_id) : undefined;
      depth++;
    }
    return null;
  };

  const displayCategories = (): CategoryWithCount[] => {
    const parentId = currentCategory?.id || null;
    let cats: Category[];

    if (!parentId) {
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

  const pageTitle = isAllProducts
    ? `${brand} — ${lang === 'it' ? 'Tutti i Prodotti' : 'All Products'}`
    : currentCategory
      ? `${brand} — ${catName(currentCategory)}`
      : brand;

  return (
    <>
      <Helmet>
        <title>{`${pageTitle} | Nexfluid`}</title>
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
            {isAllProducts ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link to={`/brands/${brandName}`}>{brand}</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{lang === 'it' ? 'Tutti i Prodotti' : 'All Products'}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : breadcrumbs.length === 0 ? (
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
              {pageTitle}
            </h1>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-40 animate-pulse bg-muted rounded-lg" />
                ))}
              </div>
            ) : (showProducts && (isAllProducts || currentCategory)) ? (
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-3">
                    {products.map(product => {
                      const qty = quantities[product.id] || 1;
                      const imgs = Array.isArray(product.images) ? product.images : [];
                      const resolvedCatImg = resolveCategoryImage(product.category_id) || categoryImageUrl;
                      return (
                        <div
                          key={product.id}
                          className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5 rounded-lg border bg-card p-4 lg:p-4 hover:shadow-md transition-shadow"
                        >
                          {/* Image — large/centered on mobile, comfortable square on desktop */}
                          <Link
                            to={`/products/${product.slug}`}
                            className="block mx-auto lg:mx-0 shrink-0 w-full max-w-[240px] aspect-square lg:w-[120px] lg:h-[120px] lg:aspect-auto rounded-md bg-muted overflow-hidden border lg:border-border"
                          >
                            <BrandedProductImage
                              src={imgs.length > 0 ? imgs[0] : null}
                              alt={prodName(product)}
                              productCode={product.product_code}
                              brand={product.brand}
                              size="lg"
                              categoryImageUrl={resolvedCatImg}
                              className="!h-full !w-full"
                            />
                          </Link>

                          {/* Text info */}
                          <div className="flex-1 min-w-0 text-center lg:text-left">
                            <p className="text-xs lg:text-sm text-muted-foreground uppercase tracking-wide">
                              <span className="font-semibold text-foreground/70">{product.brand}</span>
                              <span className="mx-1.5">·</span>
                              <span>{product.product_code}</span>
                            </p>
                            <Link
                              to={`/products/${product.slug}`}
                              className="block mt-1.5 font-semibold text-base lg:text-base text-primary hover:underline line-clamp-2"
                            >
                              {prodName(product)}
                            </Link>
                          </div>

                          {/* Actions — full row on mobile, inline on desktop */}
                          <div className="flex items-center justify-between lg:justify-end gap-2 lg:gap-3 shrink-0 mt-1 lg:mt-0">
                            <div className="flex items-center border rounded-md">
                              <button onClick={() => handleQuantity(product.id, -1)} className="px-3 py-1.5 lg:px-3 lg:py-2 text-base hover:bg-muted transition-colors">−</button>
                              <span className="px-3 py-1.5 lg:px-4 lg:py-2 text-base min-w-[2.5rem] text-center">{qty}</span>
                              <button onClick={() => handleQuantity(product.id, 1)} className="px-3 py-1.5 lg:px-3 lg:py-2 text-base hover:bg-muted transition-colors">+</button>
                            </div>
                            <Button asChild className="uppercase font-bold tracking-wide lg:px-6 lg:py-2 lg:h-auto lg:text-sm">
                              <Link to={`/products/${product.slug}`}>
                                {lang === 'it' ? 'Preventivo' : 'Quote'}
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
              /* Category grid + All Products card */
              (() => {
                const cats = displayCategories();
                return (cats.length === 0 && totalBrandCount === 0) ? (
                  <div className="text-center py-16">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">
                      {lang === 'it' ? 'Nessun prodotto trovato per questo brand.' : 'No products found for this brand.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* All Products card — always first when on brand landing */}
                    {!currentCategory && totalBrandCount > 0 && (
                      <Link
                        to={`/brands/${brandName}/all`}
                        className="group rounded-lg border bg-primary/5 border-primary/20 p-4 hover:shadow-lg transition-shadow flex flex-col items-center text-center"
                      >
                        <div className="w-full aspect-square rounded-md bg-primary/10 flex items-center justify-center mb-3">
                          <Layers className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-sm font-semibold text-primary transition-colors">
                          {lang === 'it' ? 'Tutti i Prodotti' : 'All Products'}
                        </h3>
                        <span className="text-xs text-muted-foreground mt-1">
                          {totalBrandCount} {totalBrandCount === 1 ? (lang === 'it' ? 'prodotto' : 'product') : (lang === 'it' ? 'prodotti' : 'products')}
                        </span>
                      </Link>
                    )}
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
