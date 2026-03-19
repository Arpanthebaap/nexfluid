import { Link } from 'react-router-dom';

const brandLogos = [
  { name: 'Parker', logo: '/brands/parker.png' },
  { name: 'ASCO', logo: '/brands/asco.png' },
  { name: 'AVENTICS', logo: '/brands/aventics.png' },
  { name: 'JOUCOMATIC', logo: '/brands/joucomatic.png' },
  { name: 'NUMATICS', logo: '/brands/numatics.png' },
  { name: 'EMERSON', logo: '/brands/emerson.png' },
  { name: 'SIRAI', logo: '/brands/sirai.png' },
];

const OurBrands = () => {
  return (
    <section className="py-8">
      <h2 className="text-xl font-bold sm:text-2xl font-display uppercase tracking-tight text-foreground mb-6">
        Our Brands
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {brandLogos.map((brand) => (
          <Link
            key={brand.name}
            to={`/search?q=${brand.name}`}
            className="flex items-center justify-center rounded border bg-card p-6 h-28 hover:shadow-md transition-shadow"
          >
            <img
              src={brand.logo}
              alt={`${brand.name} logo`}
              className="max-h-20 max-w-[80%] object-contain"
            />
          </Link>
        ))}
      </div>
    </section>
  );
};

export default OurBrands;
