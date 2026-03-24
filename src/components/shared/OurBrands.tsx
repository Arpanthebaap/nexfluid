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
  return (
    <section className="py-8">
      <h2 className="text-xl font-bold sm:text-2xl font-display uppercase tracking-tight text-foreground mb-6">
        Our Brands
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
        {brandLogos.map((brand) => (
          <Link
            key={brand.name}
            to={`/brands/${brand.name}`}
            className="flex items-center justify-center rounded-lg border bg-card p-4 sm:p-6 md:p-8 h-28 sm:h-36 md:h-40 lg:h-44 hover:shadow-lg transition-shadow"
          >
            <img
              src={brand.logo}
              alt={`${brand.name} logo`}
              className="max-h-16 sm:max-h-20 md:max-h-24 lg:max-h-28 max-w-[90%] object-contain"
            />
          </Link>
        ))}
      </div>
    </section>
  );
};

export default OurBrands;
