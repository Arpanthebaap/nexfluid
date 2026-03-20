

# Next Step: Update Homepage + Prepare Product Scraping Pipeline

## Two tasks to tackle now

### Task 1: Update Homepage Layout (immediate)

The homepage currently shows 4 flat category cards. We'll redesign it to show each top-level category as an expandable section with its Level-1 sub-categories visible, so users can navigate directly to sub-categories.

**New layout:**

```text
VALVES ────────────────────────────────────
[hero image]
├── Solenoid Valves    ├── Proportional Valves
├── Seat Valves        ├── Pinch Valves
├── Valve Systems      ├── Manually Operated
├── Pneumatic Valves   ├── Hydraulic Valves
└── Sensors & Switches
                                    → View All

HYDRAULIC ─────────────────────────────────
[hero image]
├── Fittings & Tubing  ├── Fluids & Filtration
├── Instrumentation    ├── Cylinders & Pumps
└── Valves & Manifolds
                                    → View All
... (same for Pneumatic, Vacuum)
```

**Changes:**
- `src/pages/Index.tsx` — fetch both top-level and Level-1 categories; render grouped sections with the parent's hero image on the left and a grid of sub-category links on the right
- Each sub-category card shows its own image (all 21 have images now)
- Responsive: on mobile, hero image stacks above the sub-category grid

### Task 2: Set Up Firecrawl Product Scraping Pipeline (after homepage)

For the ~85,000 product catalog, we'll build an automated pipeline:

1. **Connect Firecrawl** — use the connector to get API access
2. **Map source websites** — discover all product URLs from valves-direct.com and rs-online.com
3. **Scrape product pages** — extract product data (name, code, brand, specs, images, descriptions)
4. **AI rewrite** — use built-in AI (Gemini) to rewrite every description for 100% originality
5. **Category mapping** — match scraped products to our 501 categories
6. **Bulk insert** — populate the products table

This will be built as an admin tool with progress tracking. Before starting, you'll need to:
- Connect the Firecrawl connector (I'll prompt you)
- Confirm you have a Firecrawl paid plan (scraping 85K pages requires credits)

## Files to modify

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Grouped category sections with hero images + sub-category grids |
| `src/components/shared/BrandsSidebar.tsx` | Minor: handle deeper nesting for active state tracking |

## After homepage, for the scraping pipeline:

| File | Change |
|------|--------|
| `supabase/functions/firecrawl-*` | 4 edge functions for scrape/search/map/crawl |
| `src/lib/api/firecrawl.ts` | Frontend API client |
| `src/pages/admin/ProductImport.tsx` | New admin page with scraping controls and progress |
| `src/App.tsx` | Add route for product import page |
| `src/components/admin/AdminLayout.tsx` | Add nav item for import tool |

## Order of execution
1. Update homepage layout now
2. Connect Firecrawl and build scraping pipeline next

