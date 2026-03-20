

# Category Image Audit & Recommended Approach

## Current State

| Level | Count | Have Images | Missing |
|-------|-------|------------|---------|
| 0 (Top) | 4 | 4 | 0 |
| 1 (Sub) | 21 | 21 | 0 |
| 2 (Sub-sub) | 184 | 0 | **184** |
| 3 (Series) | 292 | 0 | **292** |
| **Total** | **501** | **25** | **476** |

## The Problem

476 categories have no images. However, generating 476 individual AI images is impractical and unnecessary because:

- **Level 3** (292 items) are individual product series (e.g., "Series S104 Pinch solenoid valves") — these will get real product photos when products are imported
- **Level 2** (184 items) are a mix of browsable groups (e.g., "Hydraulic Ball Valves", "Manually Operated") and series entries — most inherit the visual identity of their parent

## Recommended Approach: Image Inheritance in UI

Instead of generating hundreds of images, update the frontend code to **fall back to the parent category's image** when a category has no image of its own. This way:

- Every category page looks polished with a relevant image
- No wasted effort generating images that will be replaced by real product photos later
- The 25 existing images cascade down through the hierarchy

### Technical Changes

1. **`src/pages/Categories.tsx`** — When displaying subcategory cards, if `cat.image_url` is null, use `currentCategory.image_url` as fallback
2. **`src/pages/Index.tsx`** — Already fine (only shows Level 0 which all have images)
3. **`src/components/shared/BrandsSidebar.tsx`** — No images used, no change needed

### Code Change (single file)

In `Categories.tsx`, change the image rendering from:
```
{cat.image_url ? <img ... /> : <placeholder>}
```
to:
```
{(cat.image_url || currentCategory?.image_url) ? <img src={cat.image_url || currentCategory?.image_url} ... /> : <placeholder>}
```

This is a 2-line change that eliminates 476 placeholder icons instantly.

## What to Do After This

1. **Update homepage layout** — show grouped sub-categories under each top-level category instead of just 4 flat cards
2. **Build bulk product CSV/Excel import** in admin panel — this is the major next task
3. **Product images** will provide real visuals for the deepest categories once imported

