

# Image Strategy: Branded Placeholders + Scraped Images with Nexfluid Overlay

## Overview

Two-layer approach that works for all existing products AND future pipeline imports:

1. **Option 1 (already done)**: The `ProductPlaceholder` component is already live — shows Nexfluid logo, category, brand, product code
2. **Option 2 (new)**: Build an edge function that scrapes product images from `source_url`, stores them in cloud storage with a Nexfluid watermark overlay, and updates the product's `images` field

## How It Works

### New Edge Function: `product-image-scrape`

Processes products that have a `source_url` but empty/missing `images`:

1. Fetch the source page using Firecrawl with `formats: ['html']`
2. Extract `<img>` URLs from the product page HTML (product images typically in main content area)
3. Download each image, apply a Nexfluid watermark overlay using Canvas API (Deno has `ImageScript` library for this)
4. Upload the watermarked image to cloud storage bucket
5. Update the product's `images` JSON array with the storage URLs

**Watermark approach**: Semi-transparent Nexfluid text overlay in the bottom-right corner + subtle border/frame. This makes every image visually unique and branded.

**Alternative (simpler, no Canvas needed)**: Skip server-side watermarking. Instead, store the raw scraped images in cloud storage and apply a CSS-based Nexfluid overlay on the frontend. This is faster to implement, uses fewer resources, and achieves the same visual result.

### Pipeline Integration

- Modify `product-bulk-insert` to also extract image URLs from the scraped raw data (already available in `raw_data.links` and `raw_data.markdown`) and store them
- Future products automatically get images during import

### Admin UI Addition

- Add "Scrape Images" button to the ProductImport page that runs the image scrape in batches
- Progress tracking similar to existing pipeline

## Technical Plan

### Step 1: Create Storage Bucket
- Create a `product-images` storage bucket with public read access

### Step 2: Edge Function `product-image-scrape`
- Fetch products with `source_url` and empty `images` array
- Use Firecrawl to scrape the source page for image URLs
- Download images, upload to storage bucket
- Update product `images` field with public storage URLs

### Step 3: CSS Overlay on Frontend
- Add a Nexfluid watermark/branding overlay via CSS on all product images displayed on the site
- This applies to both scraped images and any future manually uploaded images
- Semi-transparent logo in corner + subtle branded frame

### Step 4: Pipeline Integration
- Update `product-bulk-insert` to extract image URLs from `raw_data` during import
- New products automatically get source images stored

### Step 5: Admin "Scrape Images" Button
- Add batch image scraping to the import dashboard
- Process existing products that have `source_url` but no images

## Cost Estimate
- Firecrawl credits: ~1 credit per product page (already scraped data may contain image URLs, reducing need for re-scraping)
- Storage: Cloud storage for images (included in plan)
- Processing: Edge function compute time

## Fallback Chain
For any product image display:
1. Show stored/scraped image with CSS branding overlay
2. If no image exists, show `ProductPlaceholder` component (already working)

