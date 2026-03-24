

# Fix Broken Product Placeholder Images

## Problem

The `ProductPlaceholder` component references `/lovable-uploads/log_blu_con_sfondo_bianco.png` which does not exist in the `public/lovable-uploads/` directory. This causes the broken image icon visible in product cards and detail pages for all products without photos.

## Fix

**One file change** — update `src/components/shared/ProductPlaceholder.tsx` line 37 to use the existing header logo file that IS present:

```
/lovable-uploads/log_blu_con_sfondo_bianco.png
→ /lovable-uploads/04244b88-7e59-4987-9f7a-81be85561eac.png
```

This is the same Nexfluid logo already used in the header, and it exists in `public/lovable-uploads/`. No other files need changes — all other image references point to files that exist.

