

# Unify Brand Links Across All Navigation Sections

## Problem

The OurBrands component links to `/brands/Parker` (dedicated brand pages), but:
- **Footer** links to `/search?q=Parker` (search results)
- **Mobile sidebar** (Header) links to `/search?q=PARKER` (search results)

The sidebar (BrandsSidebar) already uses `/brands/${b}` — so it's correct.

## Fix

Two files need one-line changes each:

### 1. `src/components/layout/Footer.tsx` (line 58)
Change `/search?q=${b}` → `/brands/${b}`

### 2. `src/components/layout/Header.tsx` (line 123)
Change `/search?q=${b}` → `/brands/${b}`

This ensures all four brand navigation points (OurBrands, BrandsSidebar, Footer, Mobile sidebar) link to the same dedicated brand pages.

### Files to modify
| File | Change |
|------|--------|
| `src/components/layout/Footer.tsx` | Change brand link pattern to `/brands/${b}` |
| `src/components/layout/Header.tsx` | Change brand link pattern to `/brands/${b}` |

