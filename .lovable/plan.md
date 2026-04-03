

# Redesign About Us Page to Match Figma Screenshot

## Screenshot Analysis

The Figma design for the About Us page contains these sections (top to bottom):

### 1. Hero Section (white background)
- Two-column layout
- **Left**: "NEXFLUID" as large bold primary-colored heading, followed by multiple paragraphs describing the company (industrial solutions, valves, pneumatics, hydraulics, automation, 85,000+ products)
- **Right**: Large product image (hydraulic/pneumatic fittings)

### 2. "WHAT WE OFFER" Section (light grey background)
- Centered primary-colored heading "WHAT WE OFFER"
- Descriptive paragraph below the heading
- 4 category cards in a row: **Valves, Hydraulic, Pneumatic, Vacuum**
- Each card: circular product image, bold title, description text, "Discover more →" link in primary color

### 3. "OUR BRANDS" Section (white background)
- Two-column layout: brand logos grid (4+3 layout) on the LEFT, "OUR BRANDS" heading + description on the RIGHT

### 4. "SPEAK WITH US" Section (dark primary background) — reuse existing component

### 5. "SHIPPING AND SECURITY" Section — reuse existing component

## Changes

### `src/pages/About.tsx` — Full redesign
- Remove current simple text + stats layout
- Add **Hero section**: 2-column with "NEXFLUID" heading + company description paragraphs (left), product image placeholder (right)
- Add **"What We Offer" section**: grey bg, centered heading, 4 category cards (Valves, Hydraulic, Pneumatic, Vacuum) with circular images, descriptions, "Discover more →" links
- Import and render `<OurBrands />`, `<SpeakWithUs />`, `<ShippingSecurity />` at the bottom

### `src/components/shared/OurBrands.tsx` — Redesign layout
- Change from vertical logo grid to horizontal 2-column: logos grid on left (4+3 rows), "OUR BRANDS" heading + description text on right

### Files to modify
| File | Change |
|------|--------|
| `src/pages/About.tsx` | Full redesign: hero + What We Offer + reuse shared sections |
| `src/components/shared/OurBrands.tsx` | Horizontal layout: logos left, heading+text right |

