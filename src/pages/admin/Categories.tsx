import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Category = Tables<'categories'>;

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name_en: '', name_it: '', slug: '', parent_id: '', sort_order: '0' });

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order').order('name_en');
    setCategories(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const topLevel = categories.filter((c) => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter((c) => c.parent_id === parentId);

  const openNew = () => {
    setEditing(null);
    setForm({ name_en: '', name_it: '', slug: '', parent_id: '', sort_order: '0' });
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name_en: cat.name_en,
      name_it: cat.name_it,
      slug: cat.slug,
      parent_id: cat.parent_id ?? '',
      sort_order: String(cat.sort_order),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name_en || !form.name_it || !form.slug) {
      toast({ title: 'Missing fields', variant: 'destructive' });
      return;
    }
    const payload = {
      name_en: form.name_en,
      name_it: form.name_it,
      slug: form.slug,
      parent_id: form.parent_id || null,
      sort_order: parseInt(form.sort_order) || 0,
    };

    if (editing) {
      await supabase.from('categories').update(payload).eq('id', editing.id);
      toast({ title: 'Category updated' });
    } else {
      await supabase.from('categories').insert(payload);
      toast({ title: 'Category created' });
    }
    setDialogOpen(false);
    fetchCategories();
  };

  const toggleActive = async (cat: Category) => {
    await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    fetchCategories();
  };

  const renderRow = (cat: Category, depth = 0) => (
    <>
      <TableRow key={cat.id}>
        <TableCell>
          <div className="flex items-center" style={{ paddingLeft: depth * 24 }}>
            {getChildren(cat.id).length > 0 && <ChevronRight className="h-4 w-4 mr-1 text-muted-foreground" />}
            <span className="font-medium">{cat.name_en}</span>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground">{cat.name_it}</TableCell>
        <TableCell className="font-mono text-sm text-muted-foreground">{cat.slug}</TableCell>
        <TableCell>{cat.sort_order}</TableCell>
        <TableCell>
          <Switch checked={cat.is_active} onCheckedChange={() => toggleActive(cat)} />
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>Edit</Button>
        </TableCell>
      </TableRow>
      {getChildren(cat.id).map((child) => renderRow(child, depth + 1))}
    </>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Categories</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Category' : 'New Category'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name (English) *</Label>
                <Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Name (Italian) *</Label>
                <Input value={form.name_it} onChange={(e) => setForm({ ...form, name_it: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Parent Category</Label>
                <Select value={form.parent_id} onValueChange={(v) => setForm({ ...form, parent_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="None (top-level)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top-level)</SelectItem>
                    {topLevel.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
              </div>
              <Button className="w-full" onClick={handleSave}>{editing ? 'Save Changes' : 'Create Category'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name (EN)</TableHead>
              <TableHead>Name (IT)</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : topLevel.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No categories found</TableCell></TableRow>
            ) : (
              topLevel.map((cat) => renderRow(cat))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
