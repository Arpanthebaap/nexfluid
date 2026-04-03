

# Add Description Toggle to OurBrands Component

## Problem
The OurBrands component currently shows no description text anywhere. The homepage should have no description (just heading + logos), but the About Us page should show the description paragraph under the heading.

## Solution
Add a `showDescription` prop to `OurBrands`. When `true`, render the description text below the heading. Pass `showDescription={true}` from About Us and leave it off (or `false`) on the homepage.

### `src/components/shared/OurBrands.tsx`
- Add prop `showDescription?: boolean`
- When `showDescription` is true, render the brand partnership description paragraph below the "OUR BRANDS" heading

### `src/pages/About.tsx`
- Pass `<OurBrands showDescription />` to show the description on the About Us page

### `src/pages/Index.tsx`
- No changes needed (already uses `<OurBrands />` without the prop)

### Files to modify
| File | Change |
|------|--------|
| `src/components/shared/OurBrands.tsx` | Add `showDescription` prop, conditionally render description |
| `src/pages/About.tsx` | Pass `showDescription` to OurBrands |

