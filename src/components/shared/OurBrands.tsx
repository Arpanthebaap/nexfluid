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

const OurBrands = ({ showDescription = false, layout = 'stacked' }: { showDescription?: boolean; layout?: 'stacked' | 'side-by-side' }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const logosGrid = (
    <div className="grid grid-cols-4 gap-4">
      {brandLogos.map((brand, idx) => (
        <Link
          key={brand.name}
          to={`/brands/${brand.name}`}
          className="flex items-center justify-center rounded-lg border bg-card p-4 h-24 hover:shadow-lg transition-shadow"
        >
          <img
            src={brand.logo}
            alt={`${brand.name} logo`}
            className="max-h-14 max-w-[90%] object-contain"
            width="160"
            height="56"
            loading={idx < 4 ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={idx < 4 ? 'high' : 'low'}
          />
        </Link>
      ))}
    </div>
  );

  const heading = (
    <h2 className="text-xl font-bold sm:text-2xl font-display uppercase tracking-tight text-primary">
      {lang === 'it' ? 'I NOSTRI BRAND' : 'OUR BRANDS'}
    </h2>
  );

  const description = showDescription ? (
    <p className="mt-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
      {lang === 'it'
        ? 'Collaboriamo con marchi affermati per garantire elevati standard tecnici e fornire una risposta concreta alle esigenze produttive, offrendo componenti testati e pronti all\'uso.\n\nGarantiamo disponibilità immediata a magazzino di prodotti Parker e di altri marchi, tra cui Asco, Aventics, Joucomatic, Numatics, Emerson e Sirai. Queste collaborazioni riflettono la nostra attenzione nella selezione di componenti affidabili e riconosciuti nel settore industriale.'
        : 'We work with established brands to guarantee high technical standards and provide a concrete response to production needs, offering tested components ready for use.\n\nWe ensure immediate stock availability of Parker products and other brands, including Asco, Aventics, Joucomatic, Numatics, Emerson and Sirai. These partnerships reflect our focus on selecting reliable components that are well recognized in the industrial sector.'}
    </p>
  ) : null;

  if (layout === 'stacked') {
    return (
      <div className="space-y-6">
        {heading}
        {logosGrid}
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 items-center">
      {logosGrid}
      <div>
        {heading}
        {description}
      </div>
    </div>
  );
};

export default OurBrands;
