import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import BrandsSidebar from '@/components/shared/BrandsSidebar';
import SpeakWithUs from '@/components/shared/SpeakWithUs';
import ShippingSecurity from '@/components/shared/ShippingSecurity';
import BrandedProductImage from '@/components/shared/BrandedProductImage';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage
} from '@/components/ui/breadcrumb';

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

const ProductListing = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'it' | 'en';
  const { slug } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');
  const [categoryImageUrl, setCategoryImageUrl] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchProducts = async () => {
      if (!slug) return;
      setLoading(true);

      // Get category
      const { data: cat } = await supabase
        .from('categories')
        .select('id, name_it, name_en, image_url, parent_id')
        .eq('slug', slug)
        .single();

      if (!cat) { setLoading(false); return; }
      setCategoryName(lang === 'it' ? cat.name_it : cat.name_en);

      // Walk up parent chain to find nearest category image
      let catImage = cat.image_url || null;
      if (!catImage && cat.id) {
        let parentId = (cat as any).parent_id || null;
        // Fetch parent if needed
        if (!catImage) {
          const { data: parentCats } = await supabase
            .from('categories')
            .select('id, image_url, parent_id')
            .eq('is_active', true);
          if (parentCats) {
            const pMap = new Map(parentCats.map(c => [c.id, c]));
            let cur = pMap.get(cat.id);
            while (cur && !catImage) {
              if (cur.image_url) catImage = cur.image_url;
              else cur = cur.parent_id ? pMap.get(cur.parent_id) : undefined;
            }
          }
        }
      }
      setCategoryImageUrl(catImage);

      // Get products count
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', cat.id)
        .eq('is_active', true)
        .eq('status', 'published');

      setTotalCount(count || 0);

      // Get products
      let query = supabase
        .from('products')
        .select('id, product_code, name_it, name_en, slug, brand, images, description_it, description_en')
        .eq('category_id', cat.id)
        .eq('is_active', true)
        .eq('status', 'published')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (sortBy === 'name') query = query.order('name_en');
      else if (sortBy === 'code') query = query.order('product_code');
      else query = query.order('created_at', { ascending: false });

      const { data } = await query;
      setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, [slug, page, sortBy, lang]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const updateQty = (id: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta),
    }));
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbLink asChild><Link to="/categories">{lang === 'it' ? 'Categorie' : 'Categories'}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbPage>{categoryName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex gap-8">
          <BrandsSidebar />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight font-display uppercase">
                  {categoryName}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {lang === 'it' ? `Ci sono ${totalCount}+ prodotti` : `There are ${totalCount}+ products`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:block">Sort by</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-36 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-28 animate-pulse rounded-lg border bg-muted" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  {lang === 'it' ? 'Nessun prodotto trovato.' : 'No products found.'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-3">
                  {products.map((product) => {
                    const qty = quantities[product.id] || 1;
                    const imgSrc = Array.isArray(product.images) && product.images.length > 0
                      ? (typeof product.images[0] === 'string' ? product.images[0] : (product.images[0] as any)?.url)
                      : null;
                    return (
                      <div
                        key={product.id}
                        className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5 rounded-lg border bg-card p-4 lg:p-4 hover:shadow-sm transition-shadow"
                      >
                        {/* Product image — large on mobile, comfortable square on desktop */}
                        <Link
                          to={`/products/${product.slug}`}
                          className="block mx-auto lg:mx-0 shrink-0 w-full max-w-[240px] aspect-square lg:w-[120px] lg:h-[120px] lg:aspect-auto rounded-md bg-muted overflow-hidden border lg:border-border"
                        >
                          <BrandedProductImage
                            src={imgSrc}
                            alt={`${product.product_code} ${lang === 'it' ? product.name_it : product.name_en}`}
                            productCode={product.product_code}
                            brand={product.brand}
                            categoryImageUrl={categoryImageUrl}
                            size="lg"
                            className="!h-full !w-full"
                          />
                        </Link>

                        {/* Product info */}
                        <div className="flex-1 min-w-0 text-center lg:text-left">
                          <p className="text-xs lg:text-sm text-muted-foreground uppercase tracking-wide">
                            <span className="font-semibold text-foreground/70">{product.brand}</span>
                            <span className="mx-1.5">·</span>
                            <span>{product.product_code}</span>
                          </p>
                          <Link to={`/products/${product.slug}`}>
                            <h3 className="mt-1.5 font-semibold text-base lg:text-base text-primary hover:underline line-clamp-2">
                              {lang === 'it' ? product.name_it : product.name_en}
                            </h3>
                          </Link>
                        </div>

                        {/* Qty + Quote */}
                        <div className="flex items-center justify-between lg:justify-end gap-2 lg:gap-3 shrink-0 mt-1 lg:mt-0">
                          <div className="flex items-center border rounded">
                            <button
                              onClick={() => updateQty(product.id, -1)}
                              className="px-3 py-1.5 lg:px-3 lg:py-2 text-base hover:bg-muted transition-colors"
                            >
                              −
                            </button>
                            <span className="px-3 py-1.5 lg:px-4 lg:py-2 text-base font-medium border-x min-w-[2.5rem] text-center">{qty}</span>
                            <button
                              onClick={() => updateQty(product.id, 1)}
                              className="px-3 py-1.5 lg:px-3 lg:py-2 text-base hover:bg-muted transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground uppercase font-bold tracking-wide lg:px-6 lg:py-2 lg:h-auto lg:text-sm">
                            <Link to={`/contact?product=${product.product_code}&qty=${qty}`}>
                              {lang === 'it' ? 'Preventivo' : 'Quote'}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Items {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount} items
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 0}
                        onClick={() => setPage(p => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                        <Button
                          key={i}
                          variant={page === i ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(i)}
                          className="w-8"
                        >
                          {i + 1}
                        </Button>
                      ))}
                      {totalPages > 5 && <span className="px-1">...</span>}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage(p => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <SpeakWithUs />
      <ShippingSecurity />
    </>
  );
};

export default ProductListing;
