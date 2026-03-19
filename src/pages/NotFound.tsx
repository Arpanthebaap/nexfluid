import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

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
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <p className="text-sm text-muted-foreground mb-2">404 Page Not Found</p>
          <h1 className="text-3xl md:text-4xl font-bold font-display text-primary uppercase leading-tight">
            {lang === 'it'
              ? 'Oops! Questa pagina non esiste più... Prova una nuova ricerca'
              : 'Oops! This page no longer exist... Try a new search'}
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

          {/* Decorative valve image placeholder */}
          <div className="mt-12 flex justify-center">
            <div className="h-48 w-72 rounded-lg bg-muted flex items-center justify-center text-6xl text-muted-foreground/20">
              🔧
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
