

# Redesign Product Listing Page + Admin Category Column

## What's Changing

### 1. Categories page auto-navigates to product listing for leaf categories
Currently when you click a leaf category (e.g., "Mechanically Operated"), it shows "No subcategories found" because it only renders subcategory grids. Fix: when a category has no subcategories, automatically show the product listing view instead.

**Approach**: Merge the product listing logic into `Categories.tsx` — when `subcategories.length === 0` and we have a current category, fetch and display products in the Figma design style. This eliminates the need for a separate `/products/listing/:slug` route.

### 2. Full hierarchy breadcrumbs
Currently breadcrumbs only show `Home > CategoryName`. Fix: recursively fetch parent categories to build the full chain: `Home > Valves > Manually Operated Valves > Mechanically Operated`.

### 3. Product listing UI matching Figma design (first image)
- Each product card: large product image on left (~150px), brand + code on top-right, product name as prominent link below, quantity selector (- 1 +) with bordered style, "REQUEST A QUOTE" button in dark navy
- Product images from the `images` JSON array (first image), fallback to Package icon
- Cards with subtle rounded border and hover shadow
- "There are X Products" count text
- Sort dropdown styled with border/rounded

### 4. Pagination matching design (second image)
- Left: "Items 1-10 of 50 items"
- Right: page numbers "1 2 3 ... 5" then "Next >" button
- Clean, minimal style matching the screenshot

### 5. Admin Products table: add Category column
Join products with categories to show the category path (e.g., "Mechanically Operated") in the admin product list table. Add a "Category" column between Brand and Status.

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Categories.tsx` | Add product listing when leaf category detected; full hierarchy breadcrumbs; Figma-matching product cards with images, qty selector, quote button; matching pagination |
| `src/pages/admin/Products.tsx` | Fetch category name via join or separate query; add Category column to table |
| `src/pages/ProductListing.tsx` | Keep as fallback but may redirect to Categories page |

## Technical Details

- **Breadcrumb hierarchy**: Fetch all categories once, then walk `parent_id` chain to build breadcrumb array
- **Product images**: Parse `images` JSONB field — expected format is array of URLs, display first one as `<img>` with object-contain
- **Admin category join**: Use `.select('*, categories(name_en)')` to get category name in one query

