

# Fix Nexfluid Logo Transparency & Optimize Brand Logos

## Problem
1. **Nexfluid logo** has a solid background color that clashes with the navy header/footer — needs transparent background while keeping the white text and styling intact.
2. **Brand logos** need to be larger and more visible with better responsive sizing.

## Plan

### Step 1: Regenerate Nexfluid logo with transparent background
- Use the AI image generation API (gemini-3-pro-image-preview) to edit the current `nexfluid-logo.png`
- Instruction: "Remove the background, make it fully transparent. Keep the white NEXFLUID text with the stylized X and the AUTOMATION IN STOCK tagline exactly as-is"
- Save as PNG (supports transparency)
- This will make the logo blend seamlessly into the navy header and footer

### Step 2: Regenerate all 7 brand logos at higher quality
- Use AI image generation to recreate each brand logo at larger resolution (e.g. 800x400) with transparent backgrounds and accurate corporate colors matching the reference image
- Brands: Parker (yellow on black), ASCO (red), AVENTICS (green), JOUCOMATIC (blue), Numatics (blue), EMERSON (blue), Sirai (blue/red)

### Step 3: Optimize OurBrands.tsx for responsiveness
- Increase card heights: `h-28 sm:h-36 md:h-40 lg:h-44`
- Increase logo max heights: `max-h-16 sm:max-h-20 md:max-h-24 lg:max-h-28`
- Ensure the grid scales well: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`
- Add responsive padding: `p-4 sm:p-6 md:p-8`

### Files modified
- `public/nexfluid-logo.png` — regenerated with transparent background
- `public/brands/*.png` — all 7 regenerated larger
- `src/components/shared/OurBrands.tsx` — responsive sizing improvements

