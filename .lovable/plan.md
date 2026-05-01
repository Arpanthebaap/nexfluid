## What I found

Your concern is valid. The current catalog is not fully aligned with your guidance yet.

### 1) Some end-categories are still not English
I verified the specific end-categories you listed, and these leaf categories still have non-English values in `name_en`:

- Raccordi Per Idraulica
- Morsetti Stringitubo
- Accessori Per Raccordi Idraulici
- Giunti Idraulici A Innesto Rapido
- Kit Di Guarnizioni E O Ring
- Elettrovalvole Per Pneumatica
- Valvole A Controllo Manuale Per Pneumatica
- Tubi Idraulici Assemblati
- Elementi Filtranti Idraulici
- Manometri

So yes: the English category chain is currently polluted by Italian leaf names.

### 2) The category image problem is real
I found two separate image issues:

- Several affected end-categories use generic umbrella images like:
  - `/categories/hydraulic.jpg`
  - `/categories/pneumatic.jpg`
  - `/categories/valves.jpg`
- Several other leaves use the exact same image as their parent, so sibling cards repeat the same image across the whole section.

Examples confirmed:
- `Pressure Switch` under `Vacuum Switches` is using the same image as the whole parent branch.
- `Morsetti Stringitubo` and nearby leaves under `Hydraulic Hose Assemblies` are showing mismatched repeated imagery.

### 3) The “brand logo only” fallback can still happen in some places
The product image fallback is not wired consistently across the app.

I verified in code:
- `Categories`, `BrandPage`, `ProductListing`, and `ProductDetail` already pass category fallback in some flows.
- `SearchResults` and `Related Products` do not pass category image context into `BrandedProductImage`.

That means a product without its own image can still fall all the way to the Nexfluid placeholder/brand-logo view in some screens, even when its end-category has an image.

### 4) Product placement itself is mostly fine
The problem is not mainly placement now. The bigger remaining issues are:
- wrong/non-English end-category names
- wrong or generic end-category images
- inconsistent product image fallback across pages

## Plan

### Step 1 — Fix the affected end-category names in the database
I will update the affected leaf categories so `name_en` is fully English and consistent with the existing catalog.

Rules:
- keep the existing hierarchy exactly as-is
- do not create or nurture new primary/group categories
- do not move products unless I find a clearly wrong leaf during the final audit
- use clear English end-category labels, not literal translations that create awkward duplicates

### Step 2 — Correct the affected end-category featured images
For the affected leaf categories, I will clean up `image_url` so they stop showing generic or mismatched images.

Approach:
- if a correct existing branch/leaf image already exists, reuse that
- if a leaf currently points to a generic umbrella image, replace it with a more suitable category image
- if a leaf is only inheriting a visually wrong image, assign the correct end-category image instead of leaving the mismatch
- avoid random image assignment

### Step 3 — Harden product image fallback everywhere
I will make the fallback behavior consistent across the whole frontend so products do this everywhere:

```text
product image -> end-category image -> parent category image -> grandparent image -> branded placeholder
```

This will be applied to:
- category listings
- brand listings
- product detail related-products section
- search results
- any shared product-card flow using `BrandedProductImage`

### Step 4 — Fix subcategory card image resolution
I will replace the current shallow subcategory-card logic so category cards use a proper nearest-valid-category-image resolver, instead of raw `cat.image_url || currentCategory.image_url` behavior.

This is the main reason entire rows currently show the same wrong image.

### Step 5 — Re-audit after changes
After the fixes, I will verify:
- affected end-categories show English names in chains and breadcrumbs
- the listed leaves no longer use generic/mismatched images
- products without their own images no longer fall to brand-logo placeholder when a category image exists
- spot-check the problem areas you pointed at, including:
  - `/categories/vacuum-switches`
  - `/categories/hydraulic-hose-assemblies`
  - representative product detail pages
  - search results / related products

## Technical details

Files likely involved:
- `src/components/shared/BrandedProductImage.tsx`
- `src/pages/Categories.tsx`
- `src/pages/BrandPage.tsx`
- `src/pages/ProductDetail.tsx`
- `src/pages/SearchResults.tsx`
- database data updates for `categories`

Data changes:
- update `categories.name_en` for the affected leaf categories
- update `categories.image_url` for the affected leaf categories where images are generic or mismatched

Code changes:
- centralize category image resolution
- pass resolved category image into all product-card contexts
- ensure related/search/product listing views behave the same way

## Result after implementation

When this is done:
- all those end-category chains will read in English
- end-category cards will stop showing obviously wrong repeated images
- products missing their own image will use the correct end-category image more consistently
- the catalog stays in the same structure you wanted, without revamping or nurturing the hierarchy