import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, Search, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export type FilterState = {
  brand: string[];
  attributes: Record<string, string[]>;
  ranges: {
    working_pressure?: { min?: number; max?: number };
    ambient_temp?: { min?: number; max?: number };
  };
};

export const emptyFilters: FilterState = { brand: [], attributes: {}, ranges: {} };

type Props = {
  categoryId: string;
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onClose?: () => void;
};

// Global, ordered B2B filter schema. Same vocabulary on every category page.
const ATTR_SCHEMA: { key: string; it: string; en: string; multi?: string[] }[] = [
  { key: 'Series', it: 'Serie', en: 'Series' },
  { key: 'Body Material', it: 'Materiale Corpo', en: 'Body Material', multi: ['Body Material', 'Material'] },
  { key: 'Port Size', it: 'Dimensione Porta', en: 'Port Size', multi: ['Port Size', 'Port Connection', 'Pneumatic port'] },
  { key: 'Voltage', it: 'Tensione', en: 'Voltage' },
  { key: 'Function', it: 'Funzione', en: 'Function', multi: ['Function', 'Acting principle'] },
  { key: 'Actuation Type', it: 'Tipo Attuazione', en: 'Actuation Type' },
  { key: 'Orifice Size', it: 'Diametro Orifizio', en: 'Orifice Size' },
];

type AttrAvail = Record<string, string[]>; // attribute_name -> sorted distinct values
type RangeBounds = { min: number; max: number };

const CategoryFilters = ({ categoryId, filters, onChange, onClose }: Props) => {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'it' | 'en';
  const [brands, setBrands] = useState<string[]>([]);
  const [attrs, setAttrs] = useState<AttrAvail>({});
  const [wpBounds, setWpBounds] = useState<RangeBounds | null>(null);
  const [atBounds, setAtBounds] = useState<RangeBounds | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: products } = await supabase
        .from('products')
        .select('id, brand')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .eq('status', 'published')
        .limit(1000);

      if (!products || products.length === 0) {
        setBrands([]); setAttrs({}); setWpBounds(null); setAtBounds(null);
        setLoading(false);
        return;
      }

      const brandSet = new Set<string>();
      products.forEach(p => { if (p.brand) brandSet.add(p.brand); });
      setBrands(Array.from(brandSet).sort());

      const ids = products.map(p => p.id);
      // Fetch in chunks if needed (PostgREST IN limit ~ thousands; 1000 is fine)
      const wantedNames = new Set<string>();
      ATTR_SCHEMA.forEach(s => (s.multi || [s.key]).forEach(n => wantedNames.add(n)));
      ['Working Pressure Min', 'Working Pressure Max', 'Ambient Temperature Min', 'Ambient Temperature Max']
        .forEach(n => wantedNames.add(n));

      const { data: attrRows } = await supabase
        .from('product_attributes')
        .select('attribute_name, attribute_value')
        .in('product_id', ids)
        .in('attribute_name', Array.from(wantedNames));

      const valueMap = new Map<string, Set<string>>();
      const numMap = new Map<string, number[]>();
      (attrRows || []).forEach(a => {
        if (!valueMap.has(a.attribute_name)) valueMap.set(a.attribute_name, new Set());
        valueMap.get(a.attribute_name)!.add(a.attribute_value);
        const num = parseFloat(String(a.attribute_value).replace(/[^0-9.\-]/g, ''));
        if (!Number.isNaN(num)) {
          if (!numMap.has(a.attribute_name)) numMap.set(a.attribute_name, []);
          numMap.get(a.attribute_name)!.push(num);
        }
      });

      const merged: AttrAvail = {};
      ATTR_SCHEMA.forEach(s => {
        const sources = s.multi || [s.key];
        const union = new Set<string>();
        sources.forEach(src => valueMap.get(src)?.forEach(v => union.add(v)));
        if (union.size > 0) merged[s.key] = Array.from(union).sort();
      });
      setAttrs(merged);

      const wpAll = [...(numMap.get('Working Pressure Min') || []), ...(numMap.get('Working Pressure Max') || [])];
      if (wpAll.length > 0) setWpBounds({ min: Math.floor(Math.min(...wpAll)), max: Math.ceil(Math.max(...wpAll)) });
      else setWpBounds(null);

      const atAll = [...(numMap.get('Ambient Temperature Min') || []), ...(numMap.get('Ambient Temperature Max') || [])];
      if (atAll.length > 0) setAtBounds({ min: Math.floor(Math.min(...atAll)), max: Math.ceil(Math.max(...atAll)) });
      else setAtBounds(null);

      setLoading(false);
    };
    load();
  }, [categoryId]);

  const activeCount = useMemo(() => {
    let c = filters.brand.length;
    Object.values(filters.attributes).forEach(v => c += v.length);
    if (filters.ranges.working_pressure) c += 1;
    if (filters.ranges.ambient_temp) c += 1;
    return c;
  }, [filters]);

  const toggleBrand = (b: string) => {
    const next = filters.brand.includes(b) ? filters.brand.filter(x => x !== b) : [...filters.brand, b];
    onChange({ ...filters, brand: next });
  };

  const toggleAttr = (name: string, value: string) => {
    const cur = filters.attributes[name] || [];
    const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value];
    const updated = { ...filters.attributes };
    if (next.length === 0) delete updated[name];
    else updated[name] = next;
    onChange({ ...filters, attributes: updated });
  };

  const setRange = (key: 'working_pressure' | 'ambient_temp', bounds: RangeBounds, val: [number, number]) => {
    const isFull = val[0] === bounds.min && val[1] === bounds.max;
    const ranges = { ...filters.ranges };
    if (isFull) delete ranges[key];
    else ranges[key] = { min: val[0], max: val[1] };
    onChange({ ...filters, ranges });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded border bg-muted" />)}
      </div>
    );
  }

  const hasAny = brands.length > 0 || Object.keys(attrs).length > 0 || wpBounds || atBounds;
  if (!hasAny) {
    return (
      <p className="text-xs text-muted-foreground p-2">
        {lang === 'it' ? 'Nessun filtro disponibile' : 'No filters available'}
      </p>
    );
  }

  const wpVal: [number, number] = wpBounds
    ? [filters.ranges.working_pressure?.min ?? wpBounds.min, filters.ranges.working_pressure?.max ?? wpBounds.max]
    : [0, 0];
  const atVal: [number, number] = atBounds
    ? [filters.ranges.ambient_temp?.min ?? atBounds.min, filters.ranges.ambient_temp?.max ?? atBounds.max]
    : [0, 0];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Filter className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
          {lang === 'it' ? 'Filtri' : 'Filters'}
        </h3>
        {activeCount > 0 && (
          <button onClick={() => onChange(emptyFilters)} className="ml-auto text-[11px] text-primary hover:underline">
            {lang === 'it' ? 'Azzera' : 'Clear'}
          </button>
        )}
        {onClose && (
          <button onClick={onClose} className="lg:hidden ml-1 p-1 hover:bg-muted rounded">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Brand */}
      {brands.length > 0 && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted">
            <span>{lang === 'it' ? 'Marca' : 'Brand'}</span>
            {filters.brand.length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">{filters.brand.length}</span>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="px-1 py-1.5 space-y-1 max-h-48 overflow-y-auto">
            {brands.map(b => (
              <label key={b} className="flex items-center gap-2 rounded px-2 py-1 text-xs cursor-pointer hover:bg-muted">
                <Checkbox checked={filters.brand.includes(b)} onCheckedChange={() => toggleBrand(b)} className="h-3.5 w-3.5" />
                <span className="text-muted-foreground truncate">{b}</span>
              </label>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Attributes */}
      {ATTR_SCHEMA.map(s => {
        const values = attrs[s.key];
        if (!values || values.length === 0) return null;
        const selected = filters.attributes[s.key] || [];
        const label = lang === 'it' ? s.it : s.en;
        const term = (searchTerms[s.key] || '').toLowerCase();
        const filtered = values.length > 15 && term ? values.filter(v => v.toLowerCase().includes(term)) : values;
        return (
          <Collapsible key={s.key} defaultOpen={selected.length > 0}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted">
              <span>{label}</span>
              {selected.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">{selected.length}</span>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="px-1 py-1.5 space-y-1">
              {values.length > 15 && (
                <div className="relative px-1 mb-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    value={searchTerms[s.key] || ''}
                    onChange={e => setSearchTerms(p => ({ ...p, [s.key]: e.target.value }))}
                    placeholder={lang === 'it' ? 'Cerca...' : 'Search...'}
                    className="h-7 pl-7 text-xs"
                  />
                </div>
              )}
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {filtered.map(v => (
                  <label key={v} className="flex items-center gap-2 rounded px-2 py-1 text-xs cursor-pointer hover:bg-muted">
                    <Checkbox checked={selected.includes(v)} onCheckedChange={() => toggleAttr(s.key, v)} className="h-3.5 w-3.5" />
                    <span className="text-muted-foreground truncate">{v}</span>
                  </label>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}

      {/* Working Pressure range */}
      {wpBounds && wpBounds.min < wpBounds.max && (
        <Collapsible defaultOpen={!!filters.ranges.working_pressure}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted">
            <span>{lang === 'it' ? 'Pressione di Esercizio (bar)' : 'Working Pressure (bar)'}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 py-3 space-y-3">
            <Slider
              min={wpBounds.min}
              max={wpBounds.max}
              step={1}
              value={wpVal}
              onValueChange={(v) => setRange('working_pressure', wpBounds, [v[0], v[1]] as [number, number])}
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{wpVal[0]} bar</span><span>{wpVal[1]} bar</span>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Ambient Temperature range */}
      {atBounds && atBounds.min < atBounds.max && (
        <Collapsible defaultOpen={!!filters.ranges.ambient_temp}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted">
            <span>{lang === 'it' ? 'Temperatura (°C)' : 'Temperature (°C)'}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 py-3 space-y-3">
            <Slider
              min={atBounds.min}
              max={atBounds.max}
              step={1}
              value={atVal}
              onValueChange={(v) => setRange('ambient_temp', atBounds, [v[0], v[1]] as [number, number])}
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{atVal[0]} °C</span><span>{atVal[1]} °C</span>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {onClose && (
        <Button onClick={onClose} className="w-full mt-3 lg:hidden">
          {lang === 'it' ? 'Mostra risultati' : 'Show results'}
        </Button>
      )}
    </div>
  );
};

export default CategoryFilters;
