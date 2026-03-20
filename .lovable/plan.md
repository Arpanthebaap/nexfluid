

# Clean Database + Fix Category Assignment Pipeline

## Current State

- **300 products** in the database — all from valves-direct.com, all legitimate (from subcategories of the 10 target parent categories)
- **13,590 pending scrape jobs** — also from valid subcategory URLs under the 10 targets
- **Category assignment is broken**: 7 of 9 source URL slugs (e.g. `series-iso-5599-1`, `series-tc08-valve-systems`) have NO matching category in the database. Only 2 slugs (`series-353-pulse-solenoid-valve` and `series-fsg-flat-suction-grippers`) matched. Result: 298 products are assigned to wrong parent/generic categories.
- **RS-Online** not yet scraped (no products or jobs from rs-online.com)

## Key Finding: Products ARE Valid

All 300 existing products come from valves-direct.com subcategory pages (e.g. `/series-tc08-valve-systems/`, `/series-iso-5599-1/`) which are nested under the 10 target parent categories (e.g. `/12-valve-systems`, `/10-solenoid-valves`). They should NOT be deleted — they just need correct category assignment.

## Plan

### Step 1: Create missing categories for unmatched URL slugs

7 source URL slugs from valves-direct have no matching category in the database. Create them under the correct parents:

| Source Slug | New Category | Parent Category |
|---|---|---|
| `series-iso-5599-1` | Series ISO 5599-1 Standardized Valves | Standardized Valves |
| `series-iso-5599-2` | Series ISO 5599-2 Standardized Valves | Standardized Valves |
| `series-tc08-valve-systems` | Series TC08 Valve Systems | Modular Valve Systems |
| `series-es05-valve-systems` | Series ES05 Valve Systems | Modular Valve Systems |
| `series-hf03-lg-valve-systems` | Series HF03-LG Valve Systems | Modular Valve Systems |
| `series-581-size-iso-1-standardized-valves-iso-5599-1` | Series 581 Size ISO 1 (ISO 5599-1) | Series 581 Directional Control Valves |
| `series-581-size-iso-3-standardized-valves-iso-5599-3` | Series 581 Size ISO 3 (ISO 5599-3) | Series 581 Directional Control Valves |

This is a database migration to insert these categories with the correct `parent_id` and `slug`.

### Step 2: Re-assign all 300 existing products

Run SQL updates to re-assign each product's `category_id` based on the URL slug extracted from `source_url`. After Step 1, all 9 slugs will have matching categories.

### Step 3: Verify discovery covers all 10 source pages

The discover function and `SOURCE_CATEGORY_URLS` in `ProductImport.tsx` already list all 10 valves-direct URLs. The existing 13,590 pending jobs appear to come from these categories. No changes needed here.

### Step 4: Ensure future imports get correct categories

The `product-ai-process` function already does URL-based slug matching before AI fallback. After Step 1 creates the missing categories, this will work correctly for new products too.

No code changes needed — only database operations.

## Files to Modify

| File | Change |
|---|---|
| Database migration | Insert 7 new subcategories with correct parent_ids and slugs |
| Database (data update) | UPDATE products SET category_id = matched category based on source_url slug |

## What About RS-Online?

RS-Online (`it.rs-online.com/web/b/parker/`) hasn't been scraped yet. The discovery function would need adjustment for RS-Online URL patterns (they don't use `.html` extensions). This can be addressed after the valves-direct pipeline is fully operational.

