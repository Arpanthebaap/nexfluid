

# Fix Brand Logos & Category Names to Match Figma

## What needs to change

From the Figma screenshot, two things are missing from the current implementation:

1. **Brand logos** — The Figma shows actual brand logos (Parker, ASCO, AVENTICS, JOUCOMATIC, numatics, EMERSON, Sirai) in bordered cards. Currently we only show text placeholders.

2. **Category names in sidebar** — The Figma sidebar shows exactly: VALVES, HYDRAULIC, PNEUMATIC, VACUUM. These come from the database, so they should already be correct if the data is there. We need to verify.

## Plan

### Step 1: Add brand logo images
- Source official brand logos from the web (SVG/PNG) for all 7 brands: Parker, ASCO, AVENTICS, JOUCOMATIC, numatics, EMERSON, Sirai
- Save them to `public/brands/` directory (e.g., `parker.png`, `asco.png`, etc.)
- Update `OurBrands.tsx` to display logo images instead of text, inside the same bordered card layout matching Figma (4-column grid on desktop, 2-column on mobile)

### Step 2: Verify categories in database
- Query the `categories` table to confirm Valves, Hydraulic, Pneumatic, Vacuum exist as top-level categories
- If missing, create a migration to insert them with correct `name_en`, `name_it`, `slug`, and `sort_order`

### Step 3: Ensure sidebar matches Figma
- The sidebar already pulls from the database. Once categories are correct, it will show the right names (VALVES, HYDRAULIC, PNEUMATIC, VACUUM) in uppercase as per current code.

### Step 4: Category card images
- The category cards currently show a 📦 placeholder when no `image_url` exists. We can either:
  - Add placeholder industrial product images to `public/categories/`
  - Or leave them as-is until real images are uploaded via the admin panel (Phase 2)

### Technical details
- **Files modified**: `src/components/shared/OurBrands.tsx`, potentially a new migration for categories
- **Files created**: `public/brands/*.png` (7 brand logo files)
- **No breaking changes** — purely visual updates

### Recommended approach
I suggest we do this **now** since it's a visual foundation piece. The brand logos and correct category names are essential before moving to other pages.

