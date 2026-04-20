
## Audit Result

I checked the current code against your screenshots, and the main issue is clear:

1. The new main category listing page is now `src/pages/Categories.tsx`.
2. That page is **not using** `BrandedProductImage` for product cards anymore.
3. Instead it renders a plain `<img src={imgUrl}>`, so when imported product URLs fail, the browser shows a broken image icon exactly like in your screenshot.
4. The fallback logic you specifically wanted already exists in `BrandedProductImage.tsx`:
   - product image
   - category image
   - branded placeholder
5. But that logic is currently only used in some older pages (`ProductListing.tsx`, `ProductDetail.tsx`, `BrandPage.tsx`) and is being bypassed on the page users are actually viewing.

So the real problem is not only the image import source; it is also that the latest listing UI stopped using the fallback component.

## Best Fix

I will fix this in two layers so the catalog becomes reliable everywhere:

### 1. Immediate UI fix on all public product views
Replace every raw product-card image rendering with the common fallback component so imported products never show broken icons again.

Targets:
- `src/pages/Categories.tsx`
- `src/pages/BrandPage.tsx`
- `src/pages/ProductDetail.tsx` related products
- `src/pages/SearchResults.tsx` product results
- any remaining direct product thumbnail renderers

Implementation:
- use `BrandedProductImage` everywhere for product cards
- pass `categoryImageUrl` / `categoryName` consistently
- if product image fails, it will automatically show category image or branded placeholder
- ensure small-card layout still looks clean on desktop and mobile

### 2. Strengthen the fallback chain exactly as you requested
Right now `BrandedProductImage` falls back to `ProductPlaceholder` when the main image fails, even if a category image exists but the product image alone is broken. I will improve it so it behaves more intelligently:

```text
product image works        -> show product image
product image broken       -> try category image
category image broken      -> show branded placeholder
no product image at all    -> use category image first
no category image either   -> show branded placeholder
```

This matches your instruction: if product featured image is unavailable, use the end-category image as featured.

### 3. Make the category image fallback usable for all imported products
I will standardize category fallback data flow so listing pages always have access to the nearest valid category image:
- leaf category page: current category image or nearest parent image
- brand/category listing: resolved current branch image
- related products: inherit current product’s category chain image if product has none

That way every imported product can still look complete even without a unique photo.

### 4. Keep the mirror pipeline, but stop depending on it for visual stability
The existing mirror pipeline and `mirror_status` are still useful, but it should not be the only thing preventing broken images.

I will keep this principle:
- mirrored image if available
- otherwise category image
- otherwise branded placeholder

So even if mirroring is incomplete or a source URL fails, the site still looks professional.

### 5. Optional unique-tweaked image approach within current system
You asked whether category images can be used or tweaked uniquely without wasting cost. The safest and fastest professional solution here is:

- use category image as fallback featured image for all products missing a valid image
- keep the branding/watermark overlay already built into the shared component
- avoid generating or cloning new per-product images right now
- this gives a unique branded presentation without extra API/image-generation cost

That is the best choice for this project at this stage.

## Files to Update

| File | Change |
|---|---|
| `src/pages/Categories.tsx` | Replace raw `<img>` product thumbnail with `BrandedProductImage`; pass category fallback props |
| `src/components/shared/BrandedProductImage.tsx` | Improve fallback sequence so broken product image can still fall through to category image before placeholder |
| `src/pages/BrandPage.tsx` | Normalize `src` handling and fallback props |
| `src/pages/ProductDetail.tsx` | Ensure related products and main image use same robust fallback behavior |
| `src/pages/SearchResults.tsx` | Add consistent product thumbnail rendering instead of generic icon-only result cards |

## Expected Result

After this fix:
- no broken image icons on listing pages
- imported products always show one of:
  - their own image
  - their end-category image
  - branded placeholder
- category pages look consistent and complete
- mobile and desktop listings both stay professional
- image mirroring can continue in the background, but the frontend will already be visually correct

## Technical Notes

The key regression is in `src/pages/Categories.tsx` lines around the current product card image block, where the page uses:
```tsx
{imgUrl ? <img src={imgUrl} ... /> : <Package ... />}
```

That must be replaced with the shared fallback component so the category-image inheritance system is actually used.

I will implement this without changing the catalog structure or product assignments.
