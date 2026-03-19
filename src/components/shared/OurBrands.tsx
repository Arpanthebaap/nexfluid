const brandNames = ['Parker', 'ASCO', 'AVENTICS', 'JOUCOMATIC', 'numatics', 'Emerson', 'Sirai'];

const OurBrands = () => {
  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold sm:text-3xl font-display uppercase tracking-tight text-foreground mb-8">
          Our Brands
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {brandNames.map((brand) => (
            <div
              key={brand}
              className="flex items-center justify-center rounded-lg border bg-card p-4 h-20 shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="text-lg font-bold font-display text-foreground tracking-tight">
                {brand}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OurBrands;
