import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package, CheckCircle, Send } from 'lucide-react';
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
  technical_specs: any;
  category_id: string | null;
};

type Attribute = {
  id: string;
  attribute_name: string;
  attribute_value: string;
  attribute_unit: string | null;
};

const ProductDetail = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'it' | 'en';
  const { slug } = useParams();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
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
        const { data: attrs } = await supabase
          .from('product_attributes')
          .select('*')
          .eq('product_id', prod.id);
        setAttributes(attrs || []);
      }

      setLoading(false);
    };
    fetchProduct();
  }, [slug]);

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
        language: lang,
      });
      if (error) throw error;
      toast({ title: lang === 'it' ? 'Richiesta inviata!' : 'Request sent!', description: lang === 'it' ? 'Ti contatteremo presto.' : 'We will contact you soon.' });
      setForm({ name: '', email: '', country: '', message: '' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
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
        <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">{lang === 'it' ? 'Prodotto non trovato.' : 'Product not found.'}</p>
      </div>
    );
  }

  const productName = lang === 'it' ? product.name_it : product.name_en;
  const productDesc = lang === 'it' ? product.description_it : product.description_en;

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-4 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-1">{'>'}</span>
          <Link to="/categories" className="hover:text-primary">{lang === 'it' ? 'Valvole' : 'Valves'}</Link>
          <span className="mx-1">{'>'}</span>
          <span>{product.product_code}</span>
        </div>

        <div className="flex gap-8">
          <BrandsSidebar />

          <div className="flex-1 min-w-0">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Left: Image + Details */}
              <div>
                {/* Product image */}
                <div className="aspect-square rounded-lg border bg-muted flex items-center justify-center mb-6">
                  <Package className="h-20 w-20 text-muted-foreground/30" />
                </div>

                {/* Product description */}
                {productDesc && (
                  <div className="mt-6">
                    <h2 className="text-lg font-bold font-display mb-3">
                      {lang === 'it' ? 'Descrizione Prodotto' : 'Product Description'}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{productDesc}</p>
                  </div>
                )}

                {/* Technical details */}
                {attributes.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-lg font-bold font-display mb-3">
                      {lang === 'it' ? 'Dettagli Tecnici' : 'Technical details'}
                    </h2>
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
              </div>

              {/* Right: Product info + Quote form */}
              <div>
                <div className="sticky top-24">
                  {/* Product info card */}
                  <div className="rounded-lg border bg-card p-6 mb-6">
                    <p className="text-sm text-muted-foreground">{product.brand} {product.product_code}</p>
                    <h1 className="text-xl font-bold font-display mt-1">{productName}</h1>

                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {lang === 'it' ? 'DISPONIBILE' : 'AVAILABLE'}
                    </span>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex items-center border rounded">
                        <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-1.5 text-sm hover:bg-muted">−</button>
                        <span className="px-4 py-1.5 text-sm font-medium border-x">{qty}</span>
                        <button onClick={() => setQty(q => q + 1)} className="px-3 py-1.5 text-sm hover:bg-muted">+</button>
                      </div>
                      <span className="text-sm text-muted-foreground">AMOUNT</span>
                    </div>

                    <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                      <p><span className="font-medium text-foreground">Condition:</span> NEW</p>
                      <p><span className="font-medium text-foreground">Sold by:</span> NEXFLUID</p>
                      <p><span className="font-medium text-foreground">Shipping:</span> Express Courier</p>
                    </div>

                    <Button className="mt-4 w-full bg-primary hover:bg-primary/90 uppercase font-bold tracking-wide">
                      Request a Quote
                    </Button>
                  </div>

                  {/* Quote form */}
                  <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-6 space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="pdp-name">Name</Label>
                      <Input id="pdp-name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pdp-email">Email</Label>
                      <Input id="pdp-email" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pdp-country">Shipping Country</Label>
                      <Select value={form.country} onValueChange={v => setForm(f => ({ ...f, country: v }))}>
                        <SelectTrigger id="pdp-country">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IT">Italy</SelectItem>
                          <SelectItem value="DE">Germany</SelectItem>
                          <SelectItem value="FR">France</SelectItem>
                          <SelectItem value="ES">Spain</SelectItem>
                          <SelectItem value="UK">United Kingdom</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pdp-message">Message</Label>
                      <Textarea id="pdp-message" rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Attachment</Label>
                      <Input type="file" className="text-sm" />
                    </div>
                    <Button type="submit" disabled={formLoading} className="w-full bg-primary hover:bg-primary/90 uppercase font-bold tracking-wide gap-2">
                      <Send className="h-4 w-4" />
                      {formLoading ? '...' : 'Send'}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SpeakWithUs />
      <ShippingSecurity />
    </>
  );
};

export default ProductDetail;
