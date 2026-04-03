

# Unify Brand Navigation + Category Image Fallback for Products

## Problem Analysis

There are three brand navigation menus with **inconsistent behavior**:

| Location | Link Pattern | Result |
|----------|-------------|--------|
| Footer | `/search?q=Parker` | Shows all products matching brand name — **works well** |
| Sidebar (BrandsSidebar) | `/brands/PARKER` | Shows category cards via BrandPage — **may miss products** (1000-row query limit) |
| Header mobile | `/search?q=PARKER` | Same as footer — **works well** |

The BrandPage fetches all products just to group by category, which hits the 1000-row Supabase limit for brands with many products, causing incomplete results.

## Plan

### 1. Unify sidebar brand links to use search (like footer)
**File: `src/components/shared/BrandsSidebar.tsx`**
- Change brand links from `/brands/${b}` to `/search?q=${b}` to match the footer behavior
- This ensures consistent, accurate results across all brand menus

### 2. Update SearchResults to filter by brand properly
**File: `src/pages/SearchResults.tsx`**
- Add a `brand` query parameter support (`/search?q=Parker&brand=PARKER`)
- When brand param is present, add `.ilike('brand', brandParam)` filter for precise results
- Update sidebar and footer links to use `/search?q=${b}` consistently (already works via text search)

### 3. Product image fallback: use end sub-category image
**File: `src/components/shared/BrandedProductImage.tsx`**
- Add optional `categoryImageUrl` prop
- When no product image exists AND a `categoryImageUrl` is provided, display the category image instead of the generic placeholder
- Fallback chain: product image → category image → branded placeholder

**File: `src/pages/ProductListing.tsx`**
- When fetching the category for the product listing, also fetch its `image_url`
- Pass `categoryImageUrl` to each `BrandedProductImage` component

**File: `src/pages/ProductDetail.tsx`**
- Similarly fetch the product's category image and pass it as fallback

### 4. Ensure categories have featured images
- Query the database to identify categories missing `image_url`
- For categories without images, generate relevant industrial component images using AI image generation and upload them to the product-images storage bucket
- Update the category records with the new image URLs

## Technical Details

- The search approach (`/search?q=Brand`) works better than the dedicated BrandPage because it uses `ilike` matching which handles case and partial matches, and paginates properly
- The BrandPage (`/brands/:brandName`) can remain as a route but sidebar/header/footer will all consistently link to search
- Category image inheritance means ~85,000 products get visual coverage without individual image generation — products inherit their leaf sub-category's image
- The 1000-row limit issue in BrandPage is bypassed entirely by using the search page instead

## Files to modify
| File | Change |
|------|--------|
| `src/components/shared/BrandsSidebar.tsx` | Change brand links to `/search?q=${b}` |
| `src/components/shared/BrandedProductImage.tsx` | Add `categoryImageUrl` fallback prop |
| `src/pages/ProductListing.tsx` | Fetch category image, pass to product cards |
| `src/pages/ProductDetail.tsx` | Fetch category image for fallback |
| Database query + AI image generation | Identify and fill missing category images |

