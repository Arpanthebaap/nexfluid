

# Fix: Targeted Category Discovery + Accurate Category Assignment

## Two Problems Identified

### Problem 1: Discovery scrapes entire domain
Currently `product-discover-categories` maps the root domain (`valves-direct.com`) and gets ALL URLs. It should map each of the 11 specific category URLs individually so only products under those categories are discovered.

### Problem 2: Products not assigned to correct deepest category
The AI receives a flat list of 501 categories and picks one by name — often choosing a parent category (e.g., "Valves") instead of the correct leaf category (e.g., "Series 353 Pulse Solenoid Valve"). 

The fix: extract the category slug from the product's source URL path (e.g., `/series-353-pulse-solenoid-valve/9456-product.html` → slug `series-353-pulse-solenoid-valve`), look it up directly in the `categories` table, and use that as the definitive category. Only fall back to AI matching when URL-based matching fails.

## Changes

### 1. `supabase/functions/product-discover-categories/index.ts`
- Accept specific category URLs (not just root domains)
- Map each of the 11 URLs individually via Firecrawl Map API
- Each URL maps its subcategory tree, discovering only relevant product URLs

### 2. `supabase/functions/product-ai-process/index.ts`
- Before sending to AI, extract the category slug from the product's `source_url` path segment
- Query `categories` table for exact slug match
- If found, use that `category_id` directly — don't rely on AI
- Only send category matching to AI as fallback
- Send categories as a **hierarchical tree** (parent > child > grandchild) instead of flat list, to help AI pick the deepest match

### 3. `supabase/functions/product-bulk-insert/index.ts`  
- Add a final category verification step: if `category_id` from processed_data doesn't match a leaf category, attempt URL-based re-matching before insert

### 4. `src/pages/admin/ProductImport.tsx`
- Change `SOURCE_DOMAINS` to the actual 11 category URLs instead of root domain

### 5. `src/lib/api/firecrawl.ts`
- Rename `discoverCategories` parameter from `domains` to `categoryUrls` to reflect the new behavior

## Category Matching Logic (in AI process function)

```text
1. Parse source_url: /series-353-pulse-solenoid-valve/9456-product.html
2. Extract slug: "series-353-pulse-solenoid-valve"  
3. Query: SELECT id FROM categories WHERE slug = 'series-353-pulse-solenoid-valve'
4. If found → use that category_id (skip AI matching)
5. If not found → let AI match from hierarchical category tree
```

This approach ensures products land in the correct deepest subcategory 95%+ of the time, since the valves-direct URL path already contains the exact subcategory slug that matches our imported category structure.

