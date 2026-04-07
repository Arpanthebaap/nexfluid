import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'it' | 'en';

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand + Contact */}
          <div className="space-y-4">
            <div>
              <img src="/lovable-uploads/5d7c37b3-80df-4e68-9231-7f227b905709.png" alt="Nexfluid - Automation in Stock" className="h-10 w-auto" />
            </div>
            <div className="space-y-2 text-sm text-primary-foreground/60">
              <a href="tel:+390498016529" className="flex items-center gap-2 hover:text-primary-foreground transition-colors">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                Tel 049.8016529 — Fax 049.8016551
              </a>
              <a href="mailto:info@nexfluid.it" className="flex items-center gap-2 hover:text-primary-foreground transition-colors">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                info@nexfluid.it
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Via De Gasperi, 6 Z.i. Saccolongo (PD)</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary-foreground/80">
              Categories
            </h3>
            <nav className="flex flex-col gap-1.5">
              <Link to="/categories/valves" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                {lang === 'it' ? 'Valvole' : 'Valves'}
              </Link>
              <Link to="/categories/hydraulic" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                {lang === 'it' ? 'Idraulica' : 'Hydraulic'}
              </Link>
              <Link to="/categories/pneumatic" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                {lang === 'it' ? 'Pneumatica' : 'Pneumatic'}
              </Link>
              <Link to="/categories/vacuum" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">Vacuum</Link>
            </nav>
          </div>

          {/* Brands */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary-foreground/80">Brands</h3>
            <div className="flex flex-col gap-1.5 text-sm text-primary-foreground/60">
              {['Parker', 'Asco', 'Aventics', 'Joucomatic', 'Numatics', 'Emerson', 'Sirai'].map(b => (
                <Link key={b} to={`/brands/${b}`} className="hover:text-primary-foreground transition-colors">{b}</Link>
              ))}
            </div>
          </div>

          {/* Nexfluid */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary-foreground/80">Nexfluid</h3>
            <nav className="flex flex-col gap-1.5">
              <Link to="/about" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                {lang === 'it' ? 'Chi siamo' : 'About us'}
              </Link>
              <Link to="/contact" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                {lang === 'it' ? 'Contattaci' : 'Contact us'}
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-12 border-t border-primary-foreground/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-primary-foreground/40">
          <span>Nexfluid © {new Date().getFullYear()} | All Rights Reserve</span>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-primary-foreground/60 transition-colors">Privacy Policy</Link>
            <Link to="/cookie-policy" className="hover:text-primary-foreground/60 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;