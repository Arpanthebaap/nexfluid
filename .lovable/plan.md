

# Build Dedicated Brand Pages with Category Hierarchy

## Analysis

Yes, creating dedicated brand pages is the right approach for this project. Here is why:

- **SEO value**: Proper brand landing pages (`/brands/Parker`) create indexable, shareable URLs instead of ephemeral search queries
- **User experience**: Matches the category browsing pattern users already know (as shown in the reference image), with sidebar, breadcrumbs, and drill-down navigation
- **Scalability**: ASCO has 6,400+ products — showing a category tree filtered by brand lets users navigate efficiently
- **The 1000-row problem is solvable**: Instead of fetching all products client-side, we create a database function that counts products per category for a given brand in a single query

## Architecture

The brand page will mirror the category page pattern:

```text
/brands/Parker              → Shows top-level categories containing Parker products
/brands/Parker/valves       → Shows valve subcategories with Parker products
/brands/Parker/solenoid-valves → Shows Parker products in that leaf category
```

Breadcrumb: `Home > Parker > Valves > Solenoid Valves`

The sidebar will highlight the current brand and show the category tree filtered by that brand.

## Implementation Plan

### 1. Database function for brand-category counts
Create an RPC function `get_brand_category_counts(brand_name text)` that returns category IDs with product counts for a specific brand — avoids the 1000-row client-side limit entirely.

### 2. Redesign BrandPage (`src/pages/BrandPage.tsx`)
- Accept both `brandName` and optional `slug` params
- If no slug: show top-level categories (with product counts) that have products for this brand
- If slug provided: check if it has subcategories with brand products → show subcategories; otherwise → show paginated product list (like the reference image with product cards, quantity selector, and "Request a Quote" button)
- Add proper breadcrumbs: Home > Brand > Category > Subcategory
- Include the BrandsSidebar on the left

### 3. Update routes (`src/App.tsx`)
- Add `/brands/:brandName/:slug` route for brand+category drill-down

### 4. Update OurBrands links (`src/components/shared/OurBrands.tsx`)
- Change brand logo links back to `/brands/${name}` (now that BrandPage will work properly)

### 5. Update BrandsSidebar links (`src/components/shared/BrandsSidebar.tsx`)
- Change brand links back to `/brands/${name}` for proper brand page navigation

## Files to modify

| File | Change |
|------|--------|
| New migration | Create `get_brand_category_counts` RPC function |
| `src/pages/BrandPage.tsx` | Full redesign: category hierarchy + product listing with pagination |
| `src/App.tsx` | Add `/brands/:brandName/:slug` route |
| `src/components/shared/OurBrands.tsx` | Links back to `/brands/${name}` |
| `src/components/shared/BrandsSidebar.tsx` | Links back to `/brands/${name}` |

