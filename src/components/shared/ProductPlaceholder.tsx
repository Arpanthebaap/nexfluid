import { Package } from 'lucide-react';

/**
 * Professional branded placeholder for products without images.
 * Shows the Nexfluid logo, category name, brand, and product code.
 */
const ProductPlaceholder = ({
  productCode,
  brand,
  categoryName,
  className = '',
  size = 'md',
}: {
  productCode?: string;
  brand?: string | null;
  categoryName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const sizeClasses = {
    sm: 'h-24 w-24',
    md: 'h-40 w-40',
    lg: 'w-full aspect-square',
  };

  const iconSize = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10 ${sizeClasses[size]} ${className}`}
    >
      <img
        src="/lovable-uploads/04244b88-7e59-4987-9f7a-81be85561eac.png"
        alt="Nexfluid"
        className={size === 'sm' ? 'h-5 w-auto opacity-40' : size === 'md' ? 'h-7 w-auto opacity-40' : 'h-10 w-auto opacity-40'}
      />
      {size !== 'sm' && (
        <>
          <Package className={`${iconSize[size]} text-primary/20`} />
          {categoryName && (
            <span className="text-[10px] font-medium text-primary/40 uppercase tracking-wide text-center px-2 line-clamp-1">
              {categoryName}
            </span>
          )}
          {brand && (
            <span className="text-[9px] font-bold text-primary/30 uppercase">{brand}</span>
          )}
          {productCode && size === 'lg' && (
            <span className="font-mono text-xs text-primary/25">{productCode}</span>
          )}
        </>
      )}
    </div>
  );
};

export default ProductPlaceholder;
