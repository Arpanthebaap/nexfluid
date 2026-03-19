import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Menu, X, Globe, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Header = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'it' ? 'en' : 'it');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top bar */}
      <div className="bg-[hsl(var(--nexfluid-navy))] text-primary-foreground">
        <div className="container mx-auto flex items-center justify-between px-4 py-1.5 text-xs">
          <div className="flex items-center gap-4">
            <a href="mailto:info@nexfluid.it" className="opacity-80 hover:opacity-100 transition-opacity">
              info@nexfluid.it
            </a>
            <a href="tel:+39000000000" className="hidden items-center gap-1 opacity-80 hover:opacity-100 transition-opacity sm:flex">
              <Phone className="h-3 w-3" />
              <span>+39 000 000 0000</span>
            </a>
          </div>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium opacity-80 hover:opacity-100 transition-opacity hover:bg-white/10"
          >
            <Globe className="h-3.5 w-3.5" />
            {i18n.language === 'it' ? 'EN' : 'IT'}
          </button>
        </div>
      </div>

      {/* Main header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="flex items-center">
              <span className="text-2xl font-bold tracking-tight font-['Space_Grotesk']">
                <span className="text-primary">NEX</span>
                <span className="text-[hsl(var(--nexfluid-orange))]">FLUID</span>
              </span>
            </div>
          </Link>

          {/* Search bar (desktop) */}
          <form onSubmit={handleSearch} className="hidden flex-1 max-w-xl md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('nav.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 bg-muted/50 border-muted focus:bg-card"
              />
            </div>
          </form>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-2">
            <Button asChild className="hidden bg-[hsl(var(--nexfluid-orange))] hover:bg-[hsl(var(--nexfluid-orange))]/90 text-accent-foreground sm:flex">
              <Link to="/contact">{t('nav.requestQuote')}</Link>
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-md p-2 text-foreground md:hidden hover:bg-muted"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden border-t md:block">
          <div className="container mx-auto flex items-center gap-1 px-4">
            <Link to="/" className="px-4 py-2.5 text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t('nav.home')}
            </Link>
            <Link to="/categories" className="px-4 py-2.5 text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t('nav.products')}
            </Link>
            <Link to="/about" className="px-4 py-2.5 text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t('nav.about')}
            </Link>
            <Link to="/contact" className="px-4 py-2.5 text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t('nav.contact')}
            </Link>
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-b bg-card md:hidden">
          <form onSubmit={handleSearch} className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('nav.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>
          <nav className="flex flex-col border-t">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium hover:bg-muted">
              {t('nav.home')}
            </Link>
            <Link to="/categories" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium hover:bg-muted">
              {t('nav.products')}
            </Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium hover:bg-muted">
              {t('nav.about')}
            </Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium hover:bg-muted">
              {t('nav.contact')}
            </Link>
            <div className="p-4">
              <Button asChild className="w-full bg-[hsl(var(--nexfluid-orange))] hover:bg-[hsl(var(--nexfluid-orange))]/90">
                <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>{t('nav.requestQuote')}</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
