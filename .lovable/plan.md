

# Fix Product Detail Breadcrumbs + Add Brand Pages

## Two Changes

### 1. Product Detail Page — Full Category Chain Breadcrumbs

**Current**: `Home > Valves > 97801393` (hardcoded "Valves", no real category hierarchy)

**Fix**: Fetch all categories, walk the `parent_id` chain from the product's `category_id` to root, then render:
`Home > Solenoid Valves > General Service > Series 437 > 97801393`

Each category segment is a clickable link to `/categories/{slug}`. Product code at the end is plain text.

### 2. Brand Pages — Dedicated Route

**Current**: Brand links go to `/search?q=PARKER` (generic search, no structure)

**Proposed flow**: Click "PARKER" → `/brands/PARKER` → shows categories that contain Parker products, grouped by parent → click a leaf category → goes to `/categories/{slug}` showing products

This gives brand-specific browsing with proper hierarchy. The brand page queries products grouped by `category_id` where `brand = X`, then displays those categories as cards.

Breadcrumb on brand page: `Home > Brands > PARKER`

## Files to Modify/Create

| File | Change |
|------|--------|
| `src/pages/ProductDetail.tsx` | Fetch categories, build parent chain from `category_id`, render full breadcrumb with product code at end |
| `src/pages/BrandPage.tsx` | **New** — brand landing page showing categories containing that brand's products, grouped by parent |
| `src/App.tsx` | Add `/brands/:brandName` route |
| `src/components/shared/BrandsSidebar.tsx` | Change brand links from `/search?q=X` to `/brands/X` |
| `src/components/shared/OurBrands.tsx` | Change brand links from `/search?q=X` to `/brands/X` |

