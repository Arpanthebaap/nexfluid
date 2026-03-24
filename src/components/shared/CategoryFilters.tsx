import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';

type FilterDef = {
  id: string;
  attribute_name: string;
  display_name_it: string;
  display_name_en: string;
};

type FilterGroup = {
  def: FilterDef;
  values: string[];
};

type Props = {
  categoryId: string;
  selectedFilters: Record<string, string[]>;
  onFilterChange: (filters: Record<string, string[]>) => void;
};

const CategoryFilters = ({ categoryId, selectedFilters, onFilterChange }: Props) => {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'it' | 'en';
  const [groups, setGroups] = useState<FilterGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);

      // Get filter definitions for this category
      const { data: defs } = await supabase
        .from('category_filters')
        .select('id, attribute_name, display_name_it, display_name_en')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('sort_order');

      if (!defs || defs.length === 0) {
        // Fallback: auto-discover attributes from products in this category
        const { data: products } = await supabase
          .from('products')
          .select('id')
          .eq('category_id', categoryId)
          .eq('is_active', true)
          .eq('status', 'published')
          .limit(200);

        if (products && products.length > 0) {
          const productIds = products.map(p => p.id);
          const { data: attrs } = await supabase
            .from('product_attributes')
            .select('attribute_name, attribute_value')
            .in('product_id', productIds);

          if (attrs && attrs.length > 0) {
            const groupMap = new Map<string, Set<string>>();
            attrs.forEach(a => {
              if (!groupMap.has(a.attribute_name)) groupMap.set(a.attribute_name, new Set());
              groupMap.get(a.attribute_name)!.add(a.attribute_value);
            });

            const autoGroups: FilterGroup[] = [];
            groupMap.forEach((values, name) => {
              if (values.size > 1 && values.size <= 50) {
                autoGroups.push({
                  def: { id: name, attribute_name: name, display_name_it: name, display_name_en: name },
                  values: Array.from(values).sort(),
                });
              }
            });
            setGroups(autoGroups);
          }
        }
        setLoading(false);
        return;
      }

      // Fetch attribute values for each filter definition
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .eq('status', 'published')
        .limit(500);

      if (!products || products.length === 0) {
        setLoading(false);
        return;
      }

      const productIds = products.map(p => p.id);
      const attrNames = defs.map(d => d.attribute_name);

      const { data: attrs } = await supabase
        .from('product_attributes')
        .select('attribute_name, attribute_value')
        .in('product_id', productIds)
        .in('attribute_name', attrNames);

      const valueMap = new Map<string, Set<string>>();
      (attrs || []).forEach(a => {
        if (!valueMap.has(a.attribute_name)) valueMap.set(a.attribute_name, new Set());
        valueMap.get(a.attribute_name)!.add(a.attribute_value);
      });

      const result: FilterGroup[] = defs
        .filter(d => valueMap.has(d.attribute_name) && (valueMap.get(d.attribute_name)?.size ?? 0) > 0)
        .map(d => ({
          def: d,
          values: Array.from(valueMap.get(d.attribute_name)!).sort(),
        }));

      setGroups(result);
      setLoading(false);
    };
    fetch();
  }, [categoryId]);

  const toggleValue = (attrName: string, value: string) => {
    const current = selectedFilters[attrName] || [];
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    const updated = { ...selectedFilters };
    if (next.length === 0) {
      delete updated[attrName];
    } else {
      updated[attrName] = next;
    }
    onFilterChange(updated);
  };

  const activeCount = Object.values(selectedFilters).reduce((sum, arr) => sum + arr.length, 0);

  if (loading) {
    return (
      <div className="w-56 shrink-0 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded border bg-muted" />
        ))}
      </div>
    );
  }

  if (groups.length === 0) return null;

  return (
    <div className="w-56 shrink-0">
      <div className="sticky top-24 space-y-1">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
            {lang === 'it' ? 'Filtri' : 'Filters'}
          </h3>
          {activeCount > 0 && (
            <button
              onClick={() => onFilterChange({})}
              className="ml-auto text-[10px] text-primary hover:underline"
            >
              {lang === 'it' ? 'Reset' : 'Clear'}
            </button>
          )}
        </div>

        {groups.map(group => {
          const displayName = lang === 'it' ? group.def.display_name_it : group.def.display_name_en;
          const selected = selectedFilters[group.def.attribute_name] || [];

          return (
            <Collapsible key={group.def.id} defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors">
                <span>{displayName}</span>
                {selected.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                    {selected.length}
                  </span>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="px-1 py-1.5 space-y-1 max-h-48 overflow-y-auto">
                {group.values.map(val => (
                  <label
                    key={val}
                    className="flex items-center gap-2 rounded px-2 py-1 text-xs cursor-pointer hover:bg-muted transition-colors"
                  >
                    <Checkbox
                      checked={selected.includes(val)}
                      onCheckedChange={() => toggleValue(group.def.attribute_name, val)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-muted-foreground truncate">{val}</span>
                  </label>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFilters;
