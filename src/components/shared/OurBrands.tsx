import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const brandLogos = [
  { name: 'Parker', logo: '/lovable-uploads/d79eb4f8-72e7-4b40-be99-9757c23801d9.png' },
  { name: 'ASCO', logo: '/lovable-uploads/d9635bac-3b56-47aa-94e6-ea6f9646ce32.png' },
  { name: 'AVENTICS', logo: '/lovable-uploads/7aefcd0b-457b-4058-b902-488481e5f1a8.png' },
  { name: 'JOUCOMATIC', logo: '/lovable-uploads/34983170-1e8d-43d7-8804-0224e46a0ccc.png' },
  { name: 'NUMATICS', logo: '/lovable-uploads/0a2a1dc5-ad03-4e61-866c-9a7ee87c083e.png' },
  { name: 'EMERSON', logo: '/lovable-uploads/311b84b0-11a7-4247-b05f-a11579048289.png' },
  { name: 'SIRAI', logo: '/lovable-uploads/a7e8aff3-0897-4d14-89aa-cc4f53facadd.png' },
];

const OurBrands = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <div className="grid gap-8 md:grid-cols-2 items-center">
      {/* Logos grid on the left */}
      <div className="grid grid-cols-4 gap-4">
        {brandLogos.slice(0, 4).map((brand) => (
          <Link
            key={brand.name}
            to={`/brands/${brand.name}`}
            className="flex items-center justify-center rounded-lg border bg-card p-4 h-24 hover:shadow-lg transition-shadow"
          >
            <img src={brand.logo} alt={`${brand.name} logo`} className="max-h-14 max-w-[90%] object-contain" />
          </Link>
        ))}
        {brandLogos.slice(4).map((brand) => (
          <Link
            key={brand.name}
            to={`/brands/${brand.name}`}
            className="flex items-center justify-center rounded-lg border bg-card p-4 h-24 hover:shadow-lg transition-shadow"
          >
            <img src={brand.logo} alt={`${brand.name} logo`} className="max-h-14 max-w-[90%] object-contain" />
          </Link>
        ))}
      </div>

      {/* Heading + description on the right */}
      <div>
        <h2 className="text-xl font-bold sm:text-2xl font-display uppercase tracking-tight text-primary">
          {lang === 'it' ? 'I NOSTRI BRAND' : 'OUR BRANDS'}
        </h2>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          {lang === 'it'
            ? 'Collaboriamo con i marchi più affermati nel settore dell\'automazione industriale, della pneumatica, dell\'idraulica e delle valvole. Ogni prodotto che offriamo è originale, certificato e supportato dalla garanzia del produttore.'
            : 'We work with established brands to guarantee high technical standards and provide a concrete response to production needs, offering tested components ready for use.\n\nWe ensure immediate stock availability of Parker products and other brands, including Asco, Aventics, Joucomatic, Numatics, Emerson and Sirai. These partnerships reflect our focus on selecting reliable components that are well recognized in the industrial sector.'}
        </p>
      </div>
    </div>
  );
};

export default OurBrands;
