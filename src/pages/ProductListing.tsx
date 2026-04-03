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
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchProducts = async () => {
      if (!slug) return;
      setLoading(true);

      // Get category
      const { data: cat } = await supabase
        .from('categories')
        .select('id, name_it, name_en')
        .eq('slug', slug)
        .single();

      if (!cat) { setLoading(false); return; }
      setCategoryName(lang === 'it' ? cat.name_it : cat.name_en);

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
                <div className="space-y-3">
                  {products.map((product) => {
                    const qty = quantities[product.id] || 1;
                    return (
                      <div
                        key={product.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow"
                      >
                        {/* Product image */}
                        <Link to={`/products/${product.slug}`} className="shrink-0">
                          <BrandedProductImage
                            src={Array.isArray(product.images) && product.images.length > 0
                              ? (typeof product.images[0] === 'string' ? product.images[0] : (product.images[0] as any)?.url)
                              : null}
                            alt={`${product.product_code} ${lang === 'it' ? product.name_it : product.name_en}`}
                            productCode={product.product_code}
                            brand={product.brand}
                            size="sm"
                          />
                        </Link>

                        {/* Product info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground">{product.brand} {product.product_code}</p>
                          <Link to={`/products/${product.slug}`}>
                            <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                              {lang === 'it' ? product.name_it : product.name_en}
                            </h3>
                          </Link>
                        </div>

                        {/* Qty + Quote */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center border rounded">
                            <button
                              onClick={() => updateQty(product.id, -1)}
                              className="px-2 py-1 text-sm hover:bg-muted transition-colors"
                            >
                              −
                            </button>
                            <span className="px-3 py-1 text-sm font-medium border-x">{qty}</span>
                            <button
                              onClick={() => updateQty(product.id, 1)}
                              className="px-2 py-1 text-sm hover:bg-muted transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground uppercase text-xs font-bold tracking-wide">
                            <Link to={`/contact?product=${product.product_code}&qty=${qty}`}>
                              Request a Quote
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
