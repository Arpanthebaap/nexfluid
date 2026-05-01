## Audit Result

The catalog has **52,986 products total**, of which **753 are uncategorized** (`category_id IS NULL`). This is the gap you spotted.

### Breakdown of the 753 uncategorized

| Brand | Uncategorized |
|---|---:|
| ASCO | 336 |
| AVENTICS | 323 |
| PARKER | 90 |
| NUMATICS | 4 |
| **Total** | **753** |

### Root cause

The bulk-insert function (`product-bulk-insert/index.ts`) tries to assign a category from the source URL's slug (e.g., `series-j-tri-point-miniature-pressure-switches`). It looks that slug up in the `categories` table and, **if no row matches, leaves `category_id` NULL**. That is exactly what happened here: these 753 products belong to **product series the catalog never had a category for** (e.g., Series H/J Tri-Point Pressure Switches, Series CGT Guide Slide, Series CCI-SC Stopper Compact Cylinders, RS-Online Italian slugs like `valvole-di-controllo-direzionale`, `gruppi-frl`, `guarnizioni-e-o-ring`, etc.).

The previously categorized 42K+ products worked because their URL slug already had a matching category row (e.g., `series-cci-compact-cylinders`, `series-551-552-553-solenoid-valves`).

### Top missing series (representative)

```
145  series-cgt-guide-slide                          (valves-direct)
129  series-j-tri-point-miniature-pressure-switches  (valves-direct)
119  series-h-tri-point-miniature-pressure-switches  (valves-direct)
 91  rs-online (valvole-di-controllo-direzionale, gruppi-frl, ...)
 84  series-cci-sc-stopper-compact-cylinders
 37  series-kpz-sc-stopper-compact-cylinders
 33  series-af2-flow-sensors
 26  series-189-solenoid-valves
 22  series-257-solenoid-valves
 12  series-2035-directional-control-valves
 11  series-088-miniature-solenoid-valves
... (the rest in long tail)
```

## Fix Plan

### Step 1 — Auto-create the missing categories (one SQL migration)

For every distinct URL slug among the 753 uncategorized products that has no matching category, insert a new row into `categories` with:
- `slug` = the URL slug (e.g., `series-j-tri-point-miniature-pressure-switches`)
- `name_en` / `name_it` = a humanized version of the slug (e.g., "Series J Tri-Point Miniature Pressure Switches"), matching the existing convention where 42K+ valves-direct categories were created the same way
- `parent_id` = NULL (top-level for now — same as how the existing valves-direct series categories were stored; you can re-parent them later from the admin Categories page if you want a tighter tree)
- `is_active` = true, `sort_order` = 0

Expected result: ~25–30 new category rows created (one per distinct missing slug).

### Step 2 — Backfill `category_id` on the 753 products

In the same migration, run:

```sql
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE p.category_id IS NULL
  AND c.slug = regexp_replace(
        split_part(regexp_replace(p.source_url, '^https?://[^/]+/', ''), '/', 
          CASE WHEN p.source_url ILIKE '%rs-online%' THEN 3 ELSE 1 END),
        '^\d+-', '');
```

This maps each uncategorized product to the (now-existing) category derived from its URL.

### Step 3 — Harden the importer (prevent recurrence)

Patch `supabase/functions/product-bulk-insert/index.ts` so that when the URL-derived slug doesn't match an existing category, it **auto-creates the category** instead of leaving `category_id` NULL. Same logic as Step 1, applied at insert time. This means future imports will never produce uncategorized products again.

### Step 4 — Verify

After the migration runs:

```sql
SELECT COUNT(*) FROM products WHERE category_id IS NULL;
-- Expected: 0
```

I'll also confirm via spot-check that the new categories appear in the admin Categories page and that the affected products show up under their assigned category on the public site.

## Files / Operations

| Operation | Target |
|---|---|
| Migration | INSERT new categories + UPDATE products.category_id (one transaction) |
| Edit | `supabase/functions/product-bulk-insert/index.ts` — auto-create category on URL-slug miss |

## Expected Result

- **All 52,986 products categorized** (uncategorized count drops from 753 → 0).
- **~25–30 new series categories** added under the existing structure, named consistently with the existing 42K-product convention.
- **Future imports** will never leave a product uncategorized — the importer creates the category on the fly.
- **No new images, no AI cost, no scraping work.** Pure data + one importer patch.

## Optional (after Step 1–4)

If you want a cleaner tree, you can later re-parent the auto-created categories from the admin Categories page (e.g., put `series-h-tri-point-miniature-pressure-switches` under a "Pressure Switches" parent). I can also do that as a follow-up batch if you tell me the desired groupings.