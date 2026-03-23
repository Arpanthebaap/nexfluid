

# Revert Bad Technical Details Data

## Problem

The regex extraction script parsed garbage from URLs and other non-spec text in `description_original` — producing entries like "www" → ".valves", "direct" → ".com", "index" → ".php". These are clearly wrong.

## Plan

### Step 1: Delete the bad data from `product_attributes`

Run a database migration to delete all `product_attributes` rows that were bulk-inserted by the script. The 775 products that already had legitimate attributes before the script ran should be preserved.

We can identify the bad rows because:
- The original 775 products had attributes inserted during the import pipeline (via `product-bulk-insert` edge function)
- The script-inserted rows were added later for products that previously had zero attributes

Safest approach: delete all `product_attributes` rows for products that had zero attributes before the script ran. We can identify these by checking which product IDs did NOT have attributes in the original 775 set.

### Step 2: Keep the frontend fallback as-is

The `ProductDetail.tsx` already has three fallback tiers:
1. `product_attributes` table rows
2. `technical_specs` JSON
3. Parse from `description_original`

The frontend parsing (tier 3) is fine as a display-only fallback — it doesn't persist bad data. Keep it, but the regex could be improved to skip URL-like patterns. Add a filter to exclude specs where the name or value looks like a URL fragment (contains "www", ".com", ".php", etc.).

### Files to change

| File | Change |
|------|--------|
| Database | Delete ~15,343 bad `product_attributes` rows inserted by the bulk script, preserving original 775 products' data |
| `src/pages/ProductDetail.tsx` | Add URL-fragment filter to `getSpecsFromDescription()` to skip entries containing "www", ".com", ".php", "http", etc. |

