import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, Plus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Category = Tables<'categories'>;

interface SpecRow {
  name: string;
  value: string;
  unit: string;
}

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState({
    product_code: '',
    name_it: '',
    name_en: '',
    slug: '',
    brand: '',
    category_id: '',
    status: 'draft' as string,
    description_it: '',
    description_en: '',
    meta_title_it: '',
    meta_title_en: '',
    meta_description_it: '',
    meta_description_en: '',
    featured_image: '',
  });

  const [specs, setSpecs] = useState<SpecRow[]>([]);

  useEffect(() => {
    supabase.from('categories').select('*').order('name_en').then(({ data }) => setCategories(data ?? []));
    if (!isNew && id) {
      (async () => {
        const { data } = await supabase.from('products').select('*').eq('id', id).single();
        if (data) {
          const imgs = Array.isArray(data.images) ? (data.images as any[]) : [];
          const firstImg = imgs[0];
          const featured = typeof firstImg === 'string' ? firstImg : firstImg?.url ?? '';
          setForm({
            product_code: data.product_code,
            name_it: data.name_it,
            name_en: data.name_en,
            slug: data.slug,
            brand: data.brand ?? '',
            category_id: data.category_id ?? '',
            status: data.status,
            description_it: data.description_it ?? '',
            description_en: data.description_en ?? '',
            meta_title_it: data.meta_title_it ?? '',
            meta_title_en: data.meta_title_en ?? '',
            meta_description_it: data.meta_description_it ?? '',
            meta_description_en: data.meta_description_en ?? '',
            featured_image: featured,
          });
        }
        const { data: attrs } = await supabase
          .from('product_attributes')
          .select('attribute_name, attribute_value, attribute_unit')
          .eq('product_id', id)
          .order('attribute_name');
        setSpecs((attrs ?? []).map((a) => ({
          name: a.attribute_name,
          value: a.attribute_value,
          unit: a.attribute_unit ?? '',
        })));
        setLoading(false);
      })();
    }
  }, [id, isNew]);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'name_en' && (isNew || form.slug === '')) {
      setForm((prev) => ({
        ...prev,
        [field]: value,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }));
    }
  };

  const updateSpec = (idx: number, field: keyof SpecRow, value: string) => {
    setSpecs((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };
  const addSpec = () => setSpecs((prev) => [...prev, { name: '', value: '', unit: '' }]);
  const removeSpec = (idx: number) => setSpecs((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!form.product_code || !form.name_en || !form.name_it || !form.slug) {
      toast({ title: 'Missing required fields', description: 'Code, names (IT/EN), and slug are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);

    // Build images array: featured image is first
    let images: any[] = [];
    if (!isNew && id) {
      const { data: existing } = await supabase.from('products').select('images').eq('id', id).single();
      const existingImgs = Array.isArray(existing?.images) ? (existing!.images as any[]) : [];
      // Remove old first / replace if changed
      const rest = existingImgs.slice(1);
      if (form.featured_image.trim()) {
        images = [form.featured_image.trim(), ...rest];
      } else {
        images = rest;
      }
    } else if (form.featured_image.trim()) {
      images = [form.featured_image.trim()];
    }

    const payload = {
      product_code: form.product_code,
      name_it: form.name_it,
      name_en: form.name_en,
      slug: form.slug,
      brand: form.brand || null,
      category_id: form.category_id || null,
      status: form.status as 'draft' | 'published' | 'pending_rewrite' | 'archived',
      description_it: form.description_it,
      description_en: form.description_en,
      meta_title_it: form.meta_title_it,
      meta_title_en: form.meta_title_en,
      meta_description_it: form.meta_description_it,
      meta_description_en: form.meta_description_en,
      images,
    };

    let productId = id;
    if (isNew) {
      const { data, error } = await supabase.from('products').insert([payload]).select('id').single();
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        setSaving(false);
        return;
      }
      productId = data!.id;
    } else {
      const { error } = await supabase.from('products').update(payload).eq('id', id!);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        setSaving(false);
        return;
      }
    }

    // Replace technical specs (only for existing products / once created)
    if (productId) {
      await supabase.from('product_attributes').delete().eq('product_id', productId);
      const rows = specs
        .filter((s) => s.name.trim() && s.value.trim())
        .map((s) => ({
          product_id: productId!,
          attribute_name: s.name.trim(),
          attribute_value: s.value.trim(),
          attribute_unit: s.unit.trim() || null,
        }));
      if (rows.length > 0) {
        const { error: attrErr } = await supabase.from('product_attributes').insert(rows);
        if (attrErr) {
          toast({ title: 'Specs save error', description: attrErr.message, variant: 'destructive' });
        }
      }
    }

    toast({ title: isNew ? 'Product created' : 'Product updated' });
    if (isNew) navigate('/admin/products');
    setSaving(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/products')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{isNew ? 'New Product' : 'Edit Product'}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Code *</Label>
                <Input value={form.product_code} onChange={(e) => update('product_code', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={(e) => update('slug', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Name (English) *</Label>
              <Input value={form.name_en} onChange={(e) => update('name_en', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Name (Italian) *</Label>
              <Input value={form.name_it} onChange={(e) => update('name_it', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input value={form.brand} onChange={(e) => update('brand', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={(v) => update('category_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => update('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="pending_rewrite">Pending Rewrite</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Featured Image</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                placeholder="https://… or /uploads/…"
                value={form.featured_image}
                onChange={(e) => update('featured_image', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Saved as the product's primary image. Leave blank to use the branded placeholder.
              </p>
            </div>
            {form.featured_image && (
              <div className="border rounded-md p-3 bg-muted/30">
                <img
                  src={form.featured_image}
                  alt="Preview"
                  className="max-h-48 mx-auto object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Descriptions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Description (English)</Label>
              <Textarea rows={4} value={form.description_en} onChange={(e) => update('description_en', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description (Italian)</Label>
              <Textarea rows={4} value={form.description_it} onChange={(e) => update('description_it', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Technical Specs</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={addSpec}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {specs.length === 0 && (
              <p className="text-sm text-muted-foreground">No technical specs yet. Click “Add” to create one.</p>
            )}
            {specs.map((s, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_80px_auto] gap-2 items-end">
                <div className="space-y-1">
                  {idx === 0 && <Label className="text-xs">Name</Label>}
                  <Input
                    placeholder="e.g. Working Pressure Max"
                    value={s.name}
                    onChange={(e) => updateSpec(idx, 'name', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  {idx === 0 && <Label className="text-xs">Value</Label>}
                  <Input
                    placeholder="e.g. 10"
                    value={s.value}
                    onChange={(e) => updateSpec(idx, 'value', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  {idx === 0 && <Label className="text-xs">Unit</Label>}
                  <Input
                    placeholder="bar"
                    value={s.unit}
                    onChange={(e) => updateSpec(idx, 'unit', e.target.value)}
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeSpec(idx)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Meta Title (EN)</Label>
              <Input value={form.meta_title_en} onChange={(e) => update('meta_title_en', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Meta Title (IT)</Label>
              <Input value={form.meta_title_it} onChange={(e) => update('meta_title_it', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Meta Description (EN)</Label>
              <Textarea rows={2} value={form.meta_description_en} onChange={(e) => update('meta_description_en', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Meta Description (IT)</Label>
              <Textarea rows={2} value={form.meta_description_it} onChange={(e) => update('meta_description_it', e.target.value)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {isNew ? 'Create Product' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
