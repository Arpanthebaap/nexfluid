

# Fix Missing Technical Details

## Root Cause

The product data confirms the issue. For this product (and likely most others):
- `product_attributes` table: empty (no rows)
- `technical_specs` JSON: `{}` (empty object)
- BUT `description_original` contains the specs inline: `"Ambient Temperature Max (DegC)90Ambient Temperature Min (DegC)-30Working Pressure Max (bar)8..."`

The scraping pipeline extracts raw markdown but doesn't parse specs into structured data. The AI process step passes through `rawJson.specifications` which is also empty. So specs exist in the raw text but never get structured.

## Fix: Two-Part Approach

### Part 1: Frontend — Parse specs from `description_original` (immediate fix)

In `src/pages/ProductDetail.tsx`, add a third fallback: when both `product_attributes` and `technical_specs` are empty, parse the "Product Specifications" section from `description_original`. The pattern is consistent — key-value pairs like `"Ambient Temperature Max (DegC)90"`.

Parsing logic: find the text after "Product Specifications", then use regex to extract pairs where the key contains words/parens and the value is a number or short text.

### Part 2: AI Pipeline — Extract specs during processing (future products)

In `supabase/functions/product-ai-process/index.ts`, add a `specifications` field to the AI tool schema so the AI extracts structured specs from the raw content. This ensures future products get proper `specifications` arrays that flow into `product_attributes` during import.

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/ProductDetail.tsx` | Add `description_original` spec parsing as third fallback when both `product_attributes` and `technical_specs` are empty |
| `supabase/functions/product-ai-process/index.ts` | Add `specifications` array to AI tool schema so specs get extracted for future products |

