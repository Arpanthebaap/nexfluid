import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
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
  brands: string[] | null;
  images: any;
  description_it: string | null;
  description_en: string | null;
  description_original: string | null;
  technical_specs: any;
  category_id: string | null;
  meta_description_it: string | null;
  meta_description_en: string | null;
};

type Attribute = {
  id: string;
  attribute_name: string;
  attribute_value: string;
  attribute_unit: string | null;
};

type CategoryInfo = {
  id: string;
  slug: string;
  name_it: string;
  name_en: string;
  parent_id: string | null;
  image_url: string | null;
};

type RelatedProduct = {
  id: string;
  product_code: string;
  name_it: string;
  name_en: string;
  slug: string;
  brand: string | null;
  images: any;
};

const ProductDetail = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'it' | 'en';
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const fromBrand = searchParams.get('from');
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [categoryChain, setCategoryChain] = useState<{ name: string; slug: string }[]>([]);
  const [categoryImageUrl, setCategoryImageUrl] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', country: '', message: '' });

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      setLoading(true);

      const { data: prod } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      setProduct(prod);

      if (prod) {
        // Fetch attributes
        const { data: attrs } = await supabase
          .from('product_attributes')
          .select('*')
          .eq('product_id', prod.id);
        setAttributes(attrs || []);

        // Build category breadcrumb chain
        if (prod.category_id) {
          const { data: allCats } = await supabase
            .from('categories')
            .select('id, slug, name_it, name_en, parent_id, image_url');
          if (allCats) {
            const catMap = new Map<string, CategoryInfo>();
            allCats.forEach(c => catMap.set(c.id, c));
            const chain: { name: string; slug: string }[] = [];
            let current = catMap.get(prod.category_id);
            // Walk up the chain to find the nearest category image
            let imgCat = catMap.get(prod.category_id);
            let foundImage: string | null = null;
            while (imgCat && !foundImage) {
              if (imgCat.image_url) foundImage = imgCat.image_url;
              else imgCat = imgCat.parent_id ? catMap.get(imgCat.parent_id) : undefined;
            }
            setCategoryImageUrl(foundImage);
            while (current) {
              chain.unshift({
                name: lang === 'it' ? current.name_it : current.name_en,
                slug: current.slug,
              });
              current = current.parent_id ? catMap.get(current.parent_id) : undefined;
            }
            setCategoryChain(chain);
          }

          // Fetch related products from same category
          const { data: related } = await supabase
            .from('products')
            .select('id, product_code, name_it, name_en, slug, brand, images')
            .eq('category_id', prod.category_id)
            .eq('is_active', true)
            .eq('status', 'published')
            .neq('id', prod.id)
            .limit(4);
          setRelatedProducts(related || []);
        }
      }

      setLoading(false);
    };
    fetchProduct();
  }, [slug, lang]);

  useEffect(() => {
    if (loading) return;
    if (window.location.hash === '#quote-form') {
      setTimeout(() => {
        document.getElementById('quote-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setFormLoading(true);

    try {
      const { error } = await supabase.from('quote_requests').insert({
        name: form.name,
        email: form.email,
        message: form.message || null,
        product_id: product.id,
        product_code: product.product_code,
        product_name: lang === 'it' ? product.name_it : product.name_en,
        language: lang
      });
      if (error) throw error;

      // Send email notification
      supabase.functions.invoke('quote-notify', {
        body: {
          name: form.name,
          email: form.email,
          product_code: product.product_code,
          product_name: lang === 'it' ? product.name_it : product.name_en,
          message: form.message || null,
          language: lang,
        },
      }).catch(console.error);

      toast({ title: lang === 'it' ? 'Richiesta inviata!' : 'Request sent!', description: lang === 'it' ? 'Ti contatteremo presto.' : 'We will contact you soon.' });
      setForm({ name: '', email: '', country: '', message: '' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const getProductImage = (): string | null => {
    if (!product?.images) return null;
    const imgs = product.images as any;
    if (Array.isArray(imgs) && imgs.length > 0) {
      return typeof imgs[0] === 'string' ? imgs[0] : imgs[0]?.url || null;
    }
    return null;
  };

  const garbagePattern = /www|\.com|\.php|\.html|\.asp|http|\/\/|\.co\.|\.org|\.net|\.pdf|\.KB|\.MB|\.jpg|\.png|\.gif/i;
  const garbageNames = /^(full name|email|name|country|delivery country|add to cart|submit|send|phone|message|quantity|enquire|download)$/i;

  const getTechnicalSpecsFromJson = (): { name: string; value: string }[] => {
    if (!product?.technical_specs) return [];
    const specs = product.technical_specs as Record<string, any>;
    if (typeof specs !== 'object' || Array.isArray(specs)) return [];
    return Object.entries(specs)
      .filter(([k, v]) => v !== null && v !== undefined && v !== '')
      .filter(([k, v]) => !garbagePattern.test(k) && !garbagePattern.test(String(v)))
      .filter(([k]) => !garbageNames.test(k.trim()))
      .map(([k, v]) => ({ name: k, value: String(v) }));
  };

  const getSpecsFromDescription = (): { name: string; value: string }[] => {
    if (!product?.description_original) return [];
    const text = product.description_original;
    const specIdx = text.indexOf('Product Specifications');
    if (specIdx === -1) return [];
    let specText = text.slice(specIdx + 'Product Specifications'.length);
    const boundaries = ['Download Technical', 'Enquire About', 'Add to Cart', '***', '['];
    for (const boundary of boundaries) {
      const bIdx = specText.indexOf(boundary);
      if (bIdx !== -1) specText = specText.slice(0, bIdx);
    }
    const regex = /([A-Za-z][A-Za-z\s()\/°µ.,-]+?)\s*([\d.]+[A-Za-z%°]*(?:\s*(?:to|~|-)\s*[\d.]+[A-Za-z%°]*)?|Yes|No|TRUE|FALSE|N\/A)/g;
    const results: { name: string; value: string }[] = [];
    let match;
    while ((match = regex.exec(specText)) !== null) {
      const name = match[1].trim();
      const value = match[2].trim();
      if (name.length > 2 && name.length < 80 && !garbagePattern.test(name) && !garbagePattern.test(value) && !garbageNames.test(name)) {
        results.push({ name, value });
      }
    }
    return results;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <BrandsSidebar />
          <div className="flex-1 space-y-4">
            <div className="h-8 w-48 animate-pulse bg-muted rounded" />
            <div className="h-96 animate-pulse bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <BrandedProductImage size="md" alt="Product not found" className="mx-auto" />
        <p className="mt-4 text-muted-foreground">{lang === 'it' ? 'Prodotto non trovato.' : 'Product not found.'}</p>
      </div>
    );
  }

  const productName = lang === 'it' ? product.name_it : product.name_en;
  const productDesc = lang === 'it' ? product.description_it : product.description_en;
  const productImage = getProductImage();

  // Contextual brand display: when arriving via a specific brand page (?from=BRAND),
  // show that brand if it's one of the product's brands. SEO/canonical stays on primary.
  const productBrandList = Array.isArray(product.brands) ? product.brands : [];
  const matchedFrom = fromBrand
    ? productBrandList.find(b => b.toLowerCase() === fromBrand.toLowerCase())
    : null;
  const displayBrand = matchedFrom || product.brand;
  const jsonSpecs = attributes.length === 0 ? getTechnicalSpecsFromJson() : [];
  const specsFallback = jsonSpecs.length > 0 ? jsonSpecs : (attributes.length === 0 ? getSpecsFromDescription() : []);
  const categoryLastName = categoryChain.length > 0 ? categoryChain[categoryChain.length - 1].name : undefined;

  // Schema.org Product structured data
  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    description: productDesc || undefined,
    sku: product.product_code,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    image: productImage || undefined,
    url: window.location.href,
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Nexfluid' },
    },
  };

  // Breadcrumb structured data
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: window.location.origin },
      ...categoryChain.map((cat, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: cat.name,
        item: `${window.location.origin}/categories/${cat.slug}`,
      })),
      { '@type': 'ListItem', position: categoryChain.length + 2, name: product.product_code },
    ],
  };

    return (
    <>
      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <Helmet>
        <html lang={lang} />
        <title>{`${product.product_code} ${product.brand || ''} — ${productName} | Nexfluid`}</title>
        <meta name="description" content={
          (lang === 'it' ? product.meta_description_it : product.meta_description_en)
          || `${product.product_code} ${product.brand || ''} — ${productName}. ${lang === 'it' ? 'Disponibile su Nexfluid.' : 'Available at Nexfluid.'}`
        } />
        <link rel="canonical" href={`https://nexfluid.${lang === 'it' ? 'it' : 'com'}/products/${product.slug}`} />
        <link rel="alternate" hrefLang="it" href={`https://nexfluid.it/products/${product.slug}`} />
        <link rel="alternate" hrefLang="en" href={`https://nexfluid.com/products/${product.slug}`} />
        <link rel="alternate" hrefLang="x-default" href={`https://nexfluid.it/products/${product.slug}`} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink>
            </BreadcrumbItem>
            {categoryChain.map((cat) => (
              <BreadcrumbItem key={cat.slug}>
                <BreadcrumbSeparator />
                <BreadcrumbLink asChild><Link to={`/categories/${cat.slug}`}>{cat.name}</Link></BreadcrumbLink>
              </BreadcrumbItem>
            ))}
            <BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbPage>{product.product_code}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex gap-8">
          <BrandsSidebar />

          <div className="flex-1 min-w-0">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Left: Image + Details */}
              <div>
                {/* Product image */}
                <div className="mb-6">
                  <BrandedProductImage
                    src={productImage}
                    alt={`${product.product_code} ${productName}`}
                    productCode={product.product_code}
                    brand={displayBrand}
                    categoryName={categoryLastName}
                    categoryImageUrl={categoryImageUrl}
                    size="lg"
                  />
                </div>

                {/* Product description */}
                {productDesc && (
                  <div className="mt-6">
                    <h2 className="text-lg font-bold font-display mb-1 text-primary">
                      {lang === 'it' ? 'Descrizione Prodotto' : 'Product Description'}
                    </h2>
                    <div className="w-16 h-0.5 bg-primary mb-3" />
                    <p className="text-sm text-muted-foreground leading-relaxed">{productDesc}</p>
                  </div>
                )}

                {/* Technical details from product_attributes */}
                {attributes.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-lg font-bold font-display mb-1 text-primary">
                      {lang === 'it' ? 'Dettagli Tecnici' : 'Technical Details'}
                    </h2>
                    <div className="w-16 h-0.5 bg-primary mb-3" />
                    <table className="w-full text-sm">
                      <tbody>
                        {attributes.map((attr) => (
                          <tr key={attr.id} className="border-b">
                            <td className="py-2 text-muted-foreground">{attr.attribute_name}</td>
                            <td className="py-2 text-right font-medium">{attr.attribute_value}{attr.attribute_unit ? ` ${attr.attribute_unit}` : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Technical specs fallback */}
                {specsFallback.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-lg font-bold font-display mb-1 text-primary">
                      {lang === 'it' ? 'Dettagli Tecnici' : 'Technical Details'}
                    </h2>
                    <div className="w-16 h-0.5 bg-primary mb-3" />
                    <table className="w-full text-sm">
                      <tbody>
                        {specsFallback.map((spec, i) => (
                          <tr key={i} className="border-b">
                            <td className="py-2 text-muted-foreground">{spec.name}</td>
                            <td className="py-2 text-right font-medium">{spec.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right: Product info + Quote form */}
              <div>
                <div className="sticky top-24">
                  {/* Product info card */}
                  <div className="rounded-lg border bg-card p-6 mb-6">
                    <p className="text-sm text-muted-foreground">{displayBrand} {product.product_code}</p>
                    <h1 className="text-xl font-bold font-display mt-1 text-primary">{productName}</h1>

                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-600 text-white px-3 py-1 text-xs font-medium">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {lang === 'it' ? 'DISPONIBILE' : 'AVAILABLE'}
                    </span>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex items-center border rounded">
                        <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-1.5 text-sm font-bold text-primary hover:bg-muted">−</button>
                        <span className="px-4 py-1.5 text-sm font-medium border-x">{qty}</span>
                        <button onClick={() => setQty((q) => q + 1)} className="px-3 py-1.5 text-sm font-bold text-primary hover:bg-muted">+</button>
                      </div>
                      <span className="text-sm font-medium text-primary">{lang === 'it' ? 'QUANTITÀ' : 'AMOUNT'}</span>
                    </div>

                    <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                      <p><span className="font-medium text-foreground">{lang === 'it' ? 'Condizione:' : 'Condition:'}</span> {lang === 'it' ? 'NUOVO' : 'NEW'}</p>
                      <p><span className="font-medium text-foreground">{lang === 'it' ? 'Venduto da:' : 'Sold by:'}</span> NEXFLUID</p>
                      <p><span className="font-medium text-foreground">{lang === 'it' ? 'Spedizione:' : 'Shipping:'}</span> {lang === 'it' ? 'Corriere Espresso' : 'Express Courier'}</p>
                    </div>

                    <Button
                      type="button"
                      onClick={() => {
                        document.getElementById('quote-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="mt-4 w-full uppercase font-bold tracking-wide"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {lang === 'it' ? 'Richiedi un Preventivo' : 'REQUEST A Quote'}
                    </Button>
                  </div>

                  {/* Quote Request Form */}
                  <form id="quote-form" onSubmit={handleSubmit} className="rounded-lg border bg-card p-6 space-y-4 scroll-mt-24">
                    <h2 className="text-lg font-bold font-display text-primary uppercase">
                      {lang === 'it' ? 'Richiedi un Preventivo' : 'Request a Quote'}
                    </h2>
                    <div className="w-16 h-0.5 bg-primary" />
                    <div className="space-y-1.5">
                      <Label htmlFor="qf-name" className="text-primary font-semibold">
                        {lang === 'it' ? 'Nome' : 'Name'} *
                      </Label>
                      <Input id="qf-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="qf-email" className="text-primary font-semibold">Email *</Label>
                      <Input id="qf-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="qf-country" className="text-primary font-semibold">
                        {lang === 'it' ? 'Paese di Spedizione' : 'Shipping Country'}
                      </Label>
                      <Input id="qf-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="qf-message" className="text-primary font-semibold">
                        {lang === 'it' ? 'Messaggio' : 'Message'}
                      </Label>
                      <Textarea id="qf-message" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                    </div>
                    <Button type="submit" disabled={formLoading} className="w-full uppercase font-bold tracking-wide">
                      <Send className="h-4 w-4 mr-2" />
                      {formLoading ? '...' : (lang === 'it' ? 'INVIA' : 'SEND')}
                    </Button>
                  </form>
                </div>
              </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <div className="mt-12">
                <h2 className="text-lg font-bold font-display mb-1 text-primary">
                  {lang === 'it' ? 'Prodotti Correlati' : 'Related Products'}
                </h2>
                <div className="w-16 h-0.5 bg-primary mb-4" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {relatedProducts.map((rp) => {
                    const rpName = lang === 'it' ? rp.name_it : rp.name_en;
                    const rpImg = Array.isArray(rp.images) && rp.images.length > 0
                      ? (typeof rp.images[0] === 'string' ? rp.images[0] : (rp.images[0] as any)?.url)
                      : null;
                    return (
                      <Link
                        key={rp.id}
                        to={`/products/${rp.slug}${matchedFrom ? `?from=${encodeURIComponent(matchedFrom)}` : ''}`}
                        className="group rounded-lg border bg-card p-3 hover:shadow-sm hover:border-primary/30 transition-all"
                      >
                        <BrandedProductImage
                          src={rpImg}
                          alt={`${rp.product_code} ${rpName}`}
                          productCode={rp.product_code}
                          brand={rp.brand}
                          categoryName={categoryLastName}
                          categoryImageUrl={categoryImageUrl}
                          size="lg"
                        />
                        <p className="font-mono text-xs font-semibold text-primary">{rp.product_code}</p>
                        <p className="text-xs text-muted-foreground truncate group-hover:text-primary transition-colors">{rpName}</p>
                      </Link>
                    );
                  })}
                </div>
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

export default ProductDetail;
