

# Homepage Cleanup: Remove Duplicate Search, Refine Hero

## Problem
1. **Duplicate search bars** — one in the header, another in the hero section
2. **Hero color** feels off — the deep navy/blue gradient clashes with the primary blue header, creating a heavy, monotone top section

## Solution

**Remove the hero section entirely.** Here's why:

- The header already has the search bar prominently placed — duplicating it in a hero wastes vertical space
- The header contact bar + logo + search + sign-in already communicates professionalism
- B2B industrial sites (RS Online, Parker Store, Farnell) do NOT use large hero sections — they go straight to categories and products
- Removing the hero lets "Our Brands" and category sections appear above the fold, which is what buyers actually want

**What changes:**
- Remove the entire hero `<section>` from `Index.tsx` (the gradient block with duplicate search, tagline, and trust badges)
- Move the trust badges (Express Shipping, Original Parts, Technical Support) into a slim horizontal strip below the header — clean, informative, not dominating
- The page flow becomes: Header → Trust Strip → Brands Sidebar + Our Brands + Categories

## Files to Edit

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Remove hero section, add slim trust badge strip at top of content area |

This is a single-file change that immediately makes the homepage cleaner and more professional.

