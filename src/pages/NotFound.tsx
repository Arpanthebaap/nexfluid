import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import valveCollage from '@/assets/valve-collage-404.jpg';

const NotFound = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <Helmet>
        <title>{lang === 'it' ? '404 — Pagina non trovata | Nexfluid' : '404 — Page Not Found | Nexfluid'}</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="grid gap-12 lg:grid-cols-2 items-center">
        {/* Left - Text + Search */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">404 Page Not Found</p>
          <h1 className="text-3xl md:text-4xl font-bold font-display text-primary uppercase leading-tight">
            {lang === 'it'
              ? 'Oops! Questa pagina non esiste più... Prova una nuova ricerca'
              : 'Oops! This page no longer exists... Try a new search'}
          </h1>

          <form onSubmit={handleSearch} className="mt-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={lang === 'it' ? 'Cerca per Modello, Part Number, Keyword...' : 'Search by Model, Part Number, Keyword...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-foreground/20"
              />
            </div>
          </form>
        </div>

        {/* Right - Product Image */}
        <div className="flex justify-center">
          <img
            src={valveCollage}
            alt={lang === 'it' ? 'Valvole e componenti industriali' : 'Industrial valves and components'}
            className="max-h-80 w-auto rounded-lg object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default NotFound;
