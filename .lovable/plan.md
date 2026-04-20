

## Audit Findings

Looking at the two screenshots and the code (`ProductListing.tsx`, `CategoryFilters.tsx`):

**Mobile overlap** (Screenshot 2):
- H1 "SERIES 551/552 HAND OR FOOT VALVES" wraps one word per line because the sort `<Select>` next to it consumes width on the same flex row (`justify-between`).
- Breadcrumb overflows horizontally (forces a scrollbar) — last crumb is clipped.
- WhatsApp FAB sits on top of the first product card.
- The product card collapses to vertical but image + name + qty controls stack awkwardly.

**Filters** (both screenshots):
- `CategoryFilters` component exists but **is never imported or rendered** in `ProductListing.tsx`. So the filters seen in the screenshots are coming from somewhere else / are not wired.
- Filters are auto-generated per-category (when wired), so each category has totally different filter labels — inconsistent UX across the catalog.
- Selected filter values do **not** filter the product query — even when checked, results don't change.
- No mobile entry point (no "Filters" button / drawer on mobile).

**Sort / Relevance**:
- `Select` only has Relevance / Name / Code; "Relevance" silently maps to `created_at desc` (misleading).
- Doesn't include the sorts a B2B catalog actually needs (code A→Z, brand, recently added).

## Plan

### 1. Mobile layout fix (`ProductListing.tsx`)
- Stack header vertically on mobile: H1 full width on its own row, sort `Select` on a second row right-aligned. Use `flex-col sm:flex-row sm:items-center sm:justify-between gap-3`.
- Cap H1 with `text-xl sm:text-2xl break-words` so it wraps naturally.
- Wrap breadcrumb in `overflow-x-auto` with `whitespace-nowrap` so it scrolls cleanly without pushing layout.
- Add bottom padding `pb-24` to the listing container so content clears the WhatsApp FAB.
- Re-tune product card: image on top (full-width thumbnail) on mobile, qty + quote button as a single full-width row beneath the title.

### 2. Global, professional filter system

Define **one curated, ordered filter schema** used on every leaf-category page (replace the per-category dynamic generation). Based on attribute coverage in the DB, the universal set is:

| # | Filter | Type | Source attribute(s) |
|---|--------|------|---------------------|
| 1 | Brand | checkbox | `products.brand` |
| 2 | Series | checkbox (search-in-list when >15) | `Series` |
| 3 | Body Material | checkbox | `Body Material`, `Material` |
| 4 | Port Size / Connection | checkbox | `Port Size`, `Port Connection`, `Pneumatic port` |
| 5 | Voltage | checkbox | `Voltage` |
| 6 | Working Pressure (bar) | range slider min–max | `Working Pressure Min/Max` |
| 7 | Operating Temperature (°C) | range slider | `Ambient Temperature Min/Max` |
| 8 | Function / Acting Principle | checkbox | `Function`, `Acting principle` |
| 9 | Actuation Type | checkbox | `Actuation Type` |
| 10 | Orifice Size | checkbox | `Orifice Size` |

Filters auto-hide on a given page if the current category has zero products that carry that attribute (so a "Coils" page won't show "Stroke", but the **set of possible filters and their order** is the same site-wide — exactly how RS / Parker / valves-direct present them).

**Wiring** (the missing piece):
- Refactor `CategoryFilters` to use this fixed schema and emit `{ brand: [...], 'Working Pressure': {min, max}, ... }`.
- Render it in `ProductListing.tsx` as a left rail on `lg+` and as a bottom-sheet drawer (Shadcn `Sheet`) triggered by a mobile "Filters (n)" button on `<lg`.
- Make the product query actually consume the filters: `brand` via `.in('brand', […])`; attribute filters via a join through `product_attributes` (single RPC `filter_products(category_id, filters jsonb, sort, page)` keeps it fast and avoids the 1000-row limit).
- Show active filter chips above the product list with individual X to remove + a "Clear all" link.
- URL-sync filters via `useSearchParams` so links are shareable and back-button works.

### 3. Sort dropdown — proper B2B set

Replace the 3-option select with these 6, all functional and mapped server-side:

```text
Relevance         → trigram match on category name + boost in-stock products (default)
Code A → Z        → product_code asc
Code Z → A        → product_code desc
Name A → Z        → name_{lang} asc
Brand A → Z       → brand asc, then product_code asc
Recently added    → created_at desc
```

The current "Relevance" silently meant "newest" — fix that mismatch.

### 4. Polish to match a professional catalog
- Per-page size selector (10 / 25 / 50) next to sort.
- "X of Y products" counter on the left, pagination centered, page size on the right.
- Sticky filter rail on desktop (`lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto`).
- Empty-state message updates when filters return 0 results, with a "Clear filters" CTA.

## Files to Change

| File | Change |
|---|---|
| `src/components/shared/CategoryFilters.tsx` | Rewrite to use fixed schema, range sliders, mobile drawer support, search-in-list for long lists |
| `src/pages/ProductListing.tsx` | Mobile layout fix, mount `CategoryFilters`, wire filter state, URL sync, full sort set, page-size selector, FAB clearance |
| `src/pages/SearchResults.tsx` | Same mobile header polish (header overflow there too) |
| New RPC migration | `filter_products(category_id uuid, filters jsonb, sort text, page int, page_size int)` returning paginated rows + total count, joining `product_attributes` |
| `src/components/ui/sheet.tsx` | Already exists — used for mobile filter drawer |

## Result

- Mobile view: clean stacked header, no overlap, scrollable breadcrumb, FAB no longer covers cards.
- Same 10-filter vocabulary appears on every category page (only auto-hidden when irrelevant) — consistent across the whole catalog like a real industrial distributor.
- Filters and sort actually change the product list, are URL-shareable, and have a proper mobile drawer.
- Sort offers the 6 options a B2B buyer expects, all working.

