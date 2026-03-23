

# Product Detail Page — Match Figma Design

## Changes to `src/pages/ProductDetail.tsx`

### Styling updates (keep card borders as requested):

1. **Product image**: Show actual image from `images` JSON array (first URL) with fallback to Package icon. Currently always shows icon.

2. **AVAILABLE badge**: Change from green to primary color (navy) background with white text — matching Figma design.

3. **Quantity selector buttons**: Style with primary color for `+`/`-` buttons. "AMOUNT" label in primary color.

4. **Product Description heading**: Add primary color and a small accent underline (border-bottom).

5. **Technical Details heading**: Same primary color + accent underline treatment.

6. **Technical details fallback**: When `product_attributes` is empty, display `technical_specs` JSON data if available. This recovers specs for products that have data in `technical_specs` but no rows in `product_attributes`.

7. **Quote form labels**: Bold primary color for Name, Email, Shipping Country, Message, Attachment labels.

8. **Attachment helper text**: Add "Upload any document (photos, datasheet, requisition form) you would like us to reference."

9. **Keep card borders** on both the product info card and quote form card as they are.

### Image approach
- Do NOT copy/paste images from source websites
- Show images from the `images` field in the database if they exist (these are product images already stored)
- If no image exists, show the Package placeholder icon (as now)

## Single file change

| File | Change |
|------|--------|
| `src/pages/ProductDetail.tsx` | Restyle badge, quantity, headings, labels, show product images, add technical_specs fallback |

