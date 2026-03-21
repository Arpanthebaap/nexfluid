

# Fix: Remove Fake Products + Brand Validation

## Problem Found

**Root cause**: When the scraper returns empty `raw_data` (markdown is nil, json is empty), the AI has no real content and **hallucinates completely fake products** — headphones, TVs, widgets with invented brand names.

**6 fake products to delete** (brands: WidgetCo, SoundWave, Ultra Sound, Visionary, Example Brand):
- ULTXPR-HP-BLK — "UltraX Pro Headphones" (Ultra Sound)
- AVT-SUPERWIDGETPRO — "SuperWidget Pro" (WidgetCo)
- SW-BT-HP-BLK-5.0 — "SoundWave Wireless Bluetooth Headphones" (SoundWave)
- ULTRAHD4KTV — "Ultra HD 4K LED TV" (Visionary)
- SWPRO-1.5KG — "SuperWidget Pro" (WidgetCo)
- R422102021 — "Example Brand TC08..." (Example Brand)

**31 products with non-normalized brands** (valid products, just need brand cleanup):
- "EMERSON AVENTICS" (26) → should be "AVENTICS"
- "Aventics" (3) → should be "AVENTICS"
- "EMERSON ASCO" (1) → should be "ASCO"
- "Emerson" (1) → should be "EMERSON"

## Plan

### Step 1: Delete 6 fake products
Delete products where brand is WidgetCo, SoundWave, Ultra Sound, Visionary, or Example Brand.

### Step 2: Normalize brand names
Update 31 products: "EMERSON AVENTICS" → "AVENTICS", "Aventics" → "AVENTICS", "EMERSON ASCO" → "ASCO", "Emerson" → "EMERSON".

### Step 3: Fix AI process function to prevent this
Add two guards in `product-ai-process/index.ts`:

1. **Skip jobs with empty raw_data** — if `raw_data` is null/empty or markdown is empty and json has no product_name, mark as `failed` with message "No scraped content available" instead of sending to AI.

2. **Brand whitelist validation** — after AI returns, check if brand matches allowed list (Parker, ASCO, AVENTICS, JOUCOMATIC, NUMATICS, EMERSON, SIRAI). If not, try to normalize it (strip "EMERSON " prefix, fix casing). If still not matching, mark as failed.

3. **Brand normalization map** — add explicit mapping: `EMERSON AVENTICS → AVENTICS`, `EMERSON ASCO → ASCO`, `Aventics → AVENTICS`, etc.

## Files to Modify

| File | Change |
|------|--------|
| Database (data delete) | Delete 6 fake products |
| Database (data update) | Normalize 31 product brands |
| `supabase/functions/product-ai-process/index.ts` | Add empty data guard + brand whitelist + normalization |

