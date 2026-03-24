

# Phase 5 Continued: Dynamic Filters, Homepage Hero, SEO Meta Tags

## 1. Dynamic Category Filters (Category pages)

**What**: When viewing a leaf category with products, show a sidebar with filter checkboxes auto-generated from `product_attributes` and `category_filters` tables.

**How**:
- Query `category_filters` for the current category to get which attributes to show
- Query `product_attributes` for all products in that category to get available values
- Render a collapsible filter sidebar with checkboxes for each attribute value
- Apply filters by adding `.in()` conditions to the product query
- Add to `Categories.tsx` as a left sidebar panel (replacing or alongside `BrandsSidebar` on leaf pages)

## 2. Homepage Hero Section

**What**: Add a prominent hero banner above the category grid with a large search bar, value proposition, and trust signals.

**How**:
- Add a full-width hero section at the top of `Index.tsx` with the Nexfluid gradient background
- Large centered search bar using the existing `SearchAutocomplete` component
- Tagline: "Automation in Stock — 85,000+ Industrial Components"
- Trust badges: fast shipping, original parts, technical support
- Clean, professional B2B industrial look

## 3. SEO Meta Tags (react-helmet-async)

**What**: Add page-specific `<title>`, `<meta description>`, `<link rel="canonical">`, and hreflang tags to every public page.

**How**:
- Install `react-helmet-async` and wrap `App` with `HelmetProvider`
- Add `<Helmet>` to: Index, Categories, ProductDetail, SearchResults, Contact, About, BrandPage
- ProductDetail already has schema.org JSON-LD — add `<title>` and meta description from product SEO fields
- Category pages: title = category name, description from category meta fields
- Homepage: static branded title and description
- Update `index.html` title to "Nexfluid — Automation in Stock"

## Files to Create/Edit

| File | Change |
|------|--------|
| `index.html` | Update default title to "Nexfluid" |
| `src/App.tsx` | Wrap with `HelmetProvider` |
| `src/pages/Index.tsx` | Add hero section + `<Helmet>` |
| `src/pages/Categories.tsx` | Add dynamic filter sidebar + `<Helmet>` |
| `src/pages/ProductDetail.tsx` | Add `<Helmet>` with product SEO fields |
| `src/pages/SearchResults.tsx` | Add `<Helmet>` |
| `src/pages/Contact.tsx` | Add `<Helmet>` |
| `src/pages/About.tsx` | Add `<Helmet>` |
| `src/components/shared/CategoryFilters.tsx` | NEW — reusable filter sidebar component |

