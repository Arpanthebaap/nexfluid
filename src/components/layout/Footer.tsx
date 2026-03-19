import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-[hsl(var(--nexfluid-navy))] text-white/90">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <span className="text-xl font-bold tracking-tight font-['Space_Grotesk']">
              <span className="text-white">NEX</span>
              <span className="text-[hsl(var(--nexfluid-orange))]">FLUID</span>
            </span>
            <p className="text-sm text-white/60 leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80">
              {t('footer.quickLinks')}
            </h3>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-white/60 hover:text-white transition-colors">{t('nav.home')}</Link>
              <Link to="/categories" className="text-sm text-white/60 hover:text-white transition-colors">{t('nav.products')}</Link>
              <Link to="/about" className="text-sm text-white/60 hover:text-white transition-colors">{t('nav.about')}</Link>
              <Link to="/contact" className="text-sm text-white/60 hover:text-white transition-colors">{t('nav.contact')}</Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80">
              {t('footer.contactUs')}
            </h3>
            <div className="flex flex-col gap-3">
              <a href="mailto:info@nexfluid.it" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                <Mail className="h-4 w-4 shrink-0" />
                info@nexfluid.it
              </a>
              <a href="tel:+39000000000" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                <Phone className="h-4 w-4 shrink-0" />
                +39 000 000 0000
              </a>
              <div className="flex items-start gap-2 text-sm text-white/60">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Italy</span>
              </div>
            </div>
          </div>

          {/* Industries */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80">
              Industries
            </h3>
            <div className="flex flex-col gap-2 text-sm text-white/60">
              <span>Industrial Automation</span>
              <span>Pneumatics</span>
              <span>Hydraulics</span>
              <span>Industrial Systems</span>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Nexfluid. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
