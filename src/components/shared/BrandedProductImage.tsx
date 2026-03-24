import ProductPlaceholder from './ProductPlaceholder';

/**
 * Displays a product image with a Nexfluid branding overlay,
 * or falls back to the branded placeholder if no image exists.
 */
const BrandedProductImage = ({
  src,
  alt,
  productCode,
  brand,
  categoryName,
  size = 'md',
  className = '',
}: {
  src?: string | null;
  alt: string;
  productCode?: string;
  brand?: string | null;
  categoryName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  if (!src) {
    return (
      <ProductPlaceholder
        productCode={productCode}
        brand={brand}
        categoryName={categoryName}
        size={size}
        className={className}
      />
    );
  }

  const sizeClasses = {
    sm: 'h-24 w-24',
    md: 'h-40 w-40',
    lg: 'w-full aspect-square',
  };

  return (
    <div className={`relative overflow-hidden rounded-lg bg-muted ${sizeClasses[size]} ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain p-2"
        loading="lazy"
      />
      {/* Nexfluid branding overlay — bottom-right watermark */}
      <div className="absolute bottom-0 right-0 left-0 flex items-end justify-between px-2 py-1.5 bg-gradient-to-t from-foreground/10 to-transparent pointer-events-none">
        <span className="text-[8px] font-mono text-foreground/30 uppercase tracking-wider">
          {productCode}
        </span>
        <img
          src="/lovable-uploads/04244b88-7e59-4987-9f7a-81be85561eac.png"
          alt="Nexfluid"
          className="h-3 w-auto opacity-30"
        />
      </div>
    </div>
  );
};

export default BrandedProductImage;
