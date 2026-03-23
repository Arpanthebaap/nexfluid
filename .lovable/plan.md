

# Fix Technical Details — Remove Garbage, Keep Only Valid Specs

## Problem

The `getSpecsFromDescription()` fallback parser doesn't know where specs end. It continues parsing past the actual specifications into download links (e.g., "pro.770742.pdf - 915.82KB"), country dropdown lists, and form fields — producing garbage entries.

Example from the current product's `description_original`:
```
Product Specifications
Ambient Temperature Max (DegC)150
Ambient Temperature Min (DegC)0
Working Pressure Max (bar)10
***
[Download Technical Specifications](https://www.valves-direct.com/...pro.770742.pdf...)
***
Enquire About This Product
Full Name Email Delivery Country Afghanistan Albania ...
```

The regex happily matches country names and PDF filenames as "specs."

## Fix

Single file change to `src/pages/ProductDetail.tsx` — improve `getSpecsFromDescription()`:

1. **Truncate parsing at known boundaries**: Stop reading at the first occurrence of any of these markers after "Product Specifications":
   - `Download Technical` 
   - `Enquire About`
   - `Add to Cart`
   - `***` (markdown horizontal rule)
   - `[` (markdown link start)

2. **Add additional garbage filters**: Skip any parsed entry where:
   - Name or value contains `.pdf`, `.KB`, `.MB`, country names pattern
   - Name is a single common word like "Full", "Name", "Email", "Country"
   - Value looks like a filename (contains file extensions)

3. **Also filter `getTechnicalSpecsFromJson()`**: Skip entries where the key or value contains URL/file patterns (same urlPatterns filter), since `technical_specs` JSON could also contain garbage from the scraping pipeline.

This ensures only genuine technical specifications like "Working Pressure Max (bar) → 10" are displayed, and garbage from download links, forms, and navigation is excluded.

## File

| File | Change |
|------|--------|
| `src/pages/ProductDetail.tsx` | Improve both spec-parsing fallback functions with boundary detection and stricter filtering |

