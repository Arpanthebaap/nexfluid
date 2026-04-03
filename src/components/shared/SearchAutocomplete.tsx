import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Package, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

type Suggestion = {
  id: string;
  product_code: string;
  name_it: string;
  name_en: string;
  slug: string;
  brand: string | null;
};

const SearchAutocomplete = ({ className = '', inputClassName = '', placeholder = '' }: {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
}) => {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'it' | 'en';
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const q = query.trim();
      const { data } = await supabase
        .from('products')
        .select('id, product_code, name_it, name_en, slug, brand')
        .or(`product_code.ilike.%${q}%,name_it.ilike.%${q}%,name_en.ilike.%${q}%`)
        .eq('is_active', true)
        .eq('status', 'published')
        .limit(8);
      setSuggestions(data || []);
      setOpen(true);
      setActiveIdx(-1);
      setLoading(false);
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIdx >= 0 && suggestions[activeIdx]) {
      navigate(`/products/${suggestions[activeIdx].slug}`);
    } else if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative w-full flex items-center">
          <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-10 bg-primary rounded-l-sm z-10">
            <Search className="h-5 w-5 text-primary-foreground" />
          </div>
          <Input
            type="search"
            placeholder={placeholder || (lang === 'it' ? 'Cerca per Modello, Part Number, Keyword...' : 'Search by Model, Part Number, Keyword...')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onKeyDown={handleKeyDown}
            className={`w-full pl-12 pr-4 bg-white border-0 rounded-sm h-10 text-sm text-foreground placeholder:text-muted-foreground ${inputClassName}`}
            autoComplete="off"
          />
          {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`flex items-center gap-3 w-full px-3 py-2.5 text-left text-sm transition-colors ${
                i === activeIdx ? 'bg-accent/10 text-accent-foreground' : 'hover:bg-muted'
              }`}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => {
                navigate(`/products/${s.slug}`);
                setOpen(false);
                setQuery('');
              }}
            >
              <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <span className="font-mono text-xs font-semibold text-primary">{s.product_code}</span>
                <p className="text-xs text-muted-foreground truncate">
                  {lang === 'it' ? s.name_it : s.name_en}
                </p>
              </div>
              {s.brand && <span className="text-[10px] text-muted-foreground shrink-0">{s.brand}</span>}
            </button>
          ))}
          <button
            type="button"
            className="w-full px-3 py-2 text-xs font-medium text-primary hover:bg-muted border-t text-center"
            onClick={() => {
              navigate(`/search?q=${encodeURIComponent(query.trim())}`);
              setOpen(false);
              setQuery('');
            }}
          >
            {lang === 'it' ? `Vedi tutti i risultati per "${query}"` : `See all results for "${query}"`}
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
