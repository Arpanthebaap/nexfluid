

# Update About Us Page and OurBrands Component

## Changes

### 1. Homepage (`src/pages/Index.tsx`) — No changes
Already correct, keeping as-is.

### 2. OurBrands (`src/components/shared/OurBrands.tsx`) — Remove description text
- Remove the paragraph text under "OUR BRANDS" heading
- Keep only the heading and the logo grid

### 3. About Us category images (`src/pages/About.tsx`) — Update to match homepage
Replace the current brand logo images in the 4 "What We Offer" cards with the actual category images from the homepage:
- Valves → `/categories/valves.jpg`
- Hydraulic → `/categories/hydraulic.jpg`
- Pneumatic → `/categories/pneumatic.jpg`
- Vacuum → `/categories/vacuum.jpg`

### 4. About Us hero image — Generate AI image
Generate a professional industrial image showing hydraulic/pneumatic valves and components (relevant to the company description) using the AI image generation skill. Upload it to the project and replace the current Nexfluid logo placeholder in the hero section's right column.

## Files to modify
| File | Change |
|------|--------|
| `src/components/shared/OurBrands.tsx` | Remove description paragraph |
| `src/pages/About.tsx` | Update 4 category card image paths |
| New generated image | AI-generated industrial components image for hero |

