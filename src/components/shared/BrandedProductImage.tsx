import { useState, useEffect, useMemo } from 'react';
import ProductPlaceholder from './ProductPlaceholder';

/**
 * Displays a product image with branded watermark and a 3-tier fallback chain:
 *   1. Real product image (if it loads)
 *   2. End-category image (if product image is missing or fails)
 *   3. Branded Nexfluid placeholder (final fallback)
 *
 * The fallback is staged: if the product image errors, we automatically
 * try the category image; if that also errors, we fall back to the placeholder.
 */
const BrandedProductImage = ({
  src,
  alt,
  productCode,
  brand,
  categoryName,
  categoryImageUrl,
  size = 'md',
  className = '',
}: {
  src?: string | null;
  alt: string;
  productCode?: string;
  brand?: string | null;
  categoryName?: string;
  categoryImageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  // Build the staged fallback chain (filtered & deduped)
  const chain = useMemo(() => {
    const list: string[] = [];
    if (src && typeof src === 'string' && src.trim()) list.push(src);
    if (categoryImageUrl && typeof categoryImageUrl === 'string' && categoryImageUrl.trim() && !list.includes(categoryImageUrl)) {
      list.push(categoryImageUrl);
    }
    return list;
  }, [src, categoryImageUrl]);

  const [stage, setStage] = useState(0);
  const [retryToken, setRetryToken] = useState(0);
  const [retriedStages, setRetriedStages] = useState<Set<number>>(new Set());

  // Reset stage whenever the chain changes (new product / new category)
  useEffect(() => {
    setStage(0);
    setRetryToken(0);
    setRetriedStages(new Set());
  }, [chain.join('|')]);

  const sizeClasses = {
    sm: 'h-24 w-24',
    md: 'h-40 w-40',
    lg: 'w-full aspect-square',
  };

  // Exhausted chain → branded placeholder
  if (chain.length === 0 || stage >= chain.length) {
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

  const currentSrc = chain[stage];
  const isCategoryFallback = stage > 0; // visually mark category fallback

  const handleError = () => {
    // Retry transient image errors once per stage before falling through
    if (!retriedStages.has(stage)) {
      const next = new Set(retriedStages);
      next.add(stage);
      setRetriedStages(next);
      setTimeout(() => setRetryToken(t => t + 1), 350);
      return;
    }
    setStage(s => s + 1);
  };

  return (
    <div className={`relative overflow-hidden rounded-lg bg-muted ${sizeClasses[size]} ${className}`}>
      <img
        // key forces a fresh <img> each stage so onError fires reliably
        key={`${currentSrc}|${retryToken}`}
        src={retryToken > 0 ? `${currentSrc}${currentSrc.includes('?') ? '&' : '?'}_r=${retryToken}` : currentSrc}
        alt={alt}
        className={`w-full h-full p-2 ${isCategoryFallback ? 'object-cover' : 'object-contain'}`}
        loading="lazy"
        onError={handleError}
        referrerPolicy="no-referrer"
      />
      {/* Nexfluid branding overlay — bottom watermark */}
      <div className="absolute bottom-0 right-0 left-0 flex items-end justify-between px-2 py-1.5 bg-gradient-to-t from-foreground/10 to-transparent pointer-events-none">
        <span className="text-[8px] text-foreground/30 uppercase tracking-wider truncate">
          {productCode}
        </span>
        <img
          src="/lovable-uploads/04244b88-7e59-4987-9f7a-81be85561eac.png"
          alt="Nexfluid"
          className="h-3 w-auto opacity-30 shrink-0"
        />
      </div>
    </div>
  );
};

export default BrandedProductImage;
