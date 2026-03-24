import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Menu, X, User, Phone, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

type Category = {
  id: string;
  slug: string;
  name_it: string;
  name_en: string;
  parent_id: string | null;
};

const brands = ['PARKER', 'ASCO', 'AVENTICS', 'JOUCOMATIC', 'NUMATICS', 'EMERSON', 'SIRAI'];

const Header = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const lang = i18n.language as 'it' | 'en';

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, slug, name_it, name_en, parent_id')
        .eq('is_active', true)
        .order('sort_order');
      setCategories(data || []);
    };
    fetchCategories();
  }, []);

  const topCategories = categories.filter(c => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const catName = (cat: Category) => lang === 'it' ? cat.name_it : cat.name_en;

  return (
    <>
      <header className="sticky top-0 z-50 w-full">
        {/* Top contact bar */}
        <div className="bg-primary text-primary-foreground">
          <div className="container mx-auto flex items-center justify-end gap-6 px-4 py-1.5 text-xs">
            <a href="tel:+390498016529" className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
              <Phone className="h-3 w-3" />
              <span>049.8016529</span>
            </a>
            <a href="mailto:info@nexfluid.it" className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
              <Mail className="h-3 w-3" />
              <span>info@nexfluid.it</span>
            </a>
          </div>
        </div>

        {/* Main header */}
        <div className="bg-primary">
          <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-primary-foreground lg:hidden p-1"
              aria-label="Menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo */}
            <Link to="/" className="shrink-0">
              <img src="/lovable-uploads/e1dc6237-9b39-4782-9376-28d0f7dcc073.png" alt="Nexfluid - Automation in Stock" className="h-8 md:h-10 w-auto" />
            </Link>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-6">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={lang === 'it' ? 'Cerca per Modello, Part Number, Keyword...' : 'Search by Model, Part Number, Keyword...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 bg-white border-0 rounded-sm h-10 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </form>

            {/* Sign in */}
            <div className="flex items-center gap-3">
              <Link to="/search" className="text-primary-foreground md:hidden p-1">
                <Search className="h-5 w-5" />
              </Link>
              <Link
                to="/contact"
                className="hidden md:flex items-center gap-1.5 text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors"
              >
                <User className="h-4 w-4" />
                Sign in
              </Link>
              <Link to="/contact" className="text-primary-foreground md:hidden p-1">
                <User className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Mobile search bar */}
          <form onSubmit={handleSearch} className="md:hidden px-4 pb-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={lang === 'it' ? 'Cerca per Modello, Part Number...' : 'Search by Model, Part Number...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 bg-white border-0 rounded-sm h-9 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </form>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[60] flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 w-72 max-w-[80vw] bg-white h-full overflow-y-auto shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-end p-3">
              <button onClick={() => setSidebarOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Brands */}
            <div className="px-4 pb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">Brand</h3>
              <ul className="space-y-1.5">
                {brands.map(b => (
                  <li key={b}>
                    <Link
                      to={`/search?q=${b}`}
                      onClick={() => setSidebarOpen(false)}
                      className="text-sm text-primary hover:underline flex items-center gap-1.5"
                    >
                      <span className="text-primary text-xs">{'>'}</span> {b}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div className="px-4 pb-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">Categories</h3>
              <ul className="space-y-1">
                {topCategories.map(cat => {
                  const children = getChildren(cat.id);
                  return (
                    <li key={cat.id}>
                      <Link
                        to={`/categories/${cat.slug}`}
                        onClick={() => setSidebarOpen(false)}
                        className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5"
                      >
                        <span className="text-xs">{'>'}</span> {catName(cat).toUpperCase()}
                      </Link>
                      {children.length > 0 && (
                        <ul className="ml-4 mt-1 space-y-0.5">
                          {children.map(child => (
                            <li key={child.id}>
                              <Link
                                to={`/categories/${child.slug}`}
                                onClick={() => setSidebarOpen(false)}
                                className="text-xs text-primary/80 hover:text-primary hover:underline"
                              >
                                · {catName(child)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;