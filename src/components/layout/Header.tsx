import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Menu, X, User, Phone, Mail, LogOut } from 'lucide-react';
import i18nInstance from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import SearchAutocomplete from '@/components/shared/SearchAutocomplete';

type Category = {
  id: string;
  slug: string;
  name_it: string;
  name_en: string;
  parent_id: string | null;
};

const brands = ['PARKER', 'ASCO', 'AVENTICS', 'JOUCOMATIC', 'NUMATICS', 'EMERSON', 'SIRAI'];

const LanguageSwitcher = ({ lang }: { lang: 'it' | 'en' }) => {
  const handleClick = (target: 'it' | 'en') => (e: React.MouseEvent) => {
    if (typeof window === 'undefined') return;
    const host = window.location.hostname;
    const isProd = host === 'nexfluid.it' || host === 'www.nexfluid.it' || host === 'nexfluid.com' || host === 'www.nexfluid.com';
    if (isProd) {
      const origin = target === 'it' ? 'https://nexfluid.it' : 'https://nexfluid.com';
      window.location.href = origin + window.location.pathname + window.location.search;
      e.preventDefault();
    } else {
      e.preventDefault();
      i18nInstance.changeLanguage(target);
    }
  };
  const base = 'flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold transition-colors';
  const active = 'bg-white text-primary';
  const inactive = 'text-primary-foreground/70 hover:text-primary-foreground';
  return (
    <div className="hidden md:flex items-center rounded-full overflow-hidden border border-primary-foreground/30">
      <button onClick={handleClick('it')} className={`${base} ${lang === 'it' ? active : inactive}`} aria-label="Italiano">
        <span className="text-base leading-none">🇮🇹</span>
        <span>IT</span>
      </button>
      <button onClick={handleClick('en')} className={`${base} ${lang === 'en' ? active : inactive}`} aria-label="English">
        <span className="text-base leading-none">🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
};

const Header = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
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

  const catName = (cat: Category) => lang === 'it' ? cat.name_it : cat.name_en;

  return (
    <>
      <header className="sticky top-0 z-50 w-full">
        {/* Top contact bar */}
        <div className="bg-gray-200">
          <div className="container mx-auto flex items-center justify-end gap-2 px-4 py-1.5 text-xs">
            <a href="tel:+390498016529" className="flex items-center gap-1.5 text-white rounded-full px-3 py-1 transition-colors bg-primary">
              <Phone className="h-3 w-3" />
              <span>Tel 049.8016529</span>
            </a>
            <a href="mailto:info@nexfluid.it" className="flex items-center gap-1.5 text-white rounded-full px-3 py-1 transition-colors bg-primary">
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
              <img src="/lovable-uploads/f98792b3-9ddb-4b96-b688-27ee7bbf2994.png" alt="Nexfluid - Automation in Stock" className="h-16 md:h-24 w-auto" />
            </Link>

            {/* Search bar with autocomplete */}
            <SearchAutocomplete className="hidden md:block flex-1 max-w-lg mx-6" />

            {/* Sign in / User menu */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher lang={lang} />
              {user ? (
                <>
                  <button
                    onClick={() => signOut()}
                    className="hidden md:flex items-center gap-1.5 text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    {lang === 'it' ? 'Esci' : 'Sign out'}
                  </button>
                  <button onClick={() => signOut()} className="text-primary-foreground md:hidden p-1">
                    <LogOut className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/sign-in"
                    className="hidden md:flex items-center gap-1.5 text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors"
                  >
                    <User className="h-4 w-4" />
                    {lang === 'it' ? 'Accedi' : 'Sign in'}
                  </Link>
                  <Link to="/sign-in" className="text-primary-foreground md:hidden p-1">
                    <User className="h-5 w-5" />
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile search bar */}
          <div className="md:hidden px-4 pb-3">
            <SearchAutocomplete
              inputClassName="h-9"
              placeholder={lang === 'it' ? 'Cerca per Modello, Part Number...' : 'Search by Model, Part Number...'}
            />
          </div>
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
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">{lang === 'it' ? 'Marchi' : 'Brands'}</h3>
              <ul className="space-y-1.5">
                {brands.map(b => (
                  <li key={b}>
                    <Link
                      to={`/brands/${b}`}
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
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">{lang === 'it' ? 'Categorie' : 'Categories'}</h3>
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