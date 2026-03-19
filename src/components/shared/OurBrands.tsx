import { Link } from 'react-router-dom';

const brandNames = [
  { name: 'Parker', display: 'Parker' },
  { name: 'ASCO', display: 'ASCO' },
  { name: 'AVENTICS', display: 'AVENTICS' },
  { name: 'JOUCOMATIC', display: 'JOUCOMATIC' },
  { name: 'NUMATICS', display: 'numatics' },
  { name: 'EMERSON', display: 'Emerson' },
  { name: 'SIRAI', display: 'Sirai' },
];

const OurBrands = () => {
  return (
    <section className="py-8">
      <h2 className="text-xl font-bold sm:text-2xl font-display uppercase tracking-tight text-foreground mb-6">
        Our Brands
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {brandNames.map((brand) => (
          <Link
            key={brand.name}
            to={`/search?q=${brand.name}`}
            className="flex items-center justify-center rounded border bg-card p-4 h-16 hover:shadow-md transition-shadow"
          >
            <span className="text-base font-bold font-display text-foreground tracking-tight">
              {brand.display}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default OurBrands;