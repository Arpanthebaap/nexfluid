

# Redesign Contact Us and 404 Pages to Match Figma

## Differences Identified

### Contact Us Page (Current vs Figma)

| Element | Current | Figma Design |
|---------|---------|--------------|
| Title | "Request a Quote" with subtitle paragraph | "CONTACT US" only, no subtitle |
| Layout | 3-column (1 info + 2 form) with card border around info | 2-column, left = contact info list (no card border), right = form |
| Contact info | Email, Phone (placeholder), Location in a bordered card | "Call us:" with Tel + Fax, "Contact us on WhatsApp:" with number, "Mail us:" with email, "Position:" with address — each with bold label and icon |
| Form fields | Name, Company, Email, Phone, Product, Message | Name, Surname (not Company), Mail, Telephone, Message — simpler form |
| Labels | Small label above input | Primary-colored labels above inputs (text-primary) |
| Submit button | Orange with Send icon + text | "SEND" button, primary colored (blue), no icon |
| Map | Missing | Full-width Google Maps embed below the form section |
| WhatsApp FAB | Missing | Green WhatsApp floating button bottom-right |
| Footer email | info@nexfluid.it | info@dinafluid.it |
| Footer address | Via De Gasperi, 4 Z.I. Sarmeolago (PD) | Via De Gasperi, 6 Z.i. Saccolongo (PD) |
| Footer fax | 049.801651 | 049.8016551 |
| Footer copyright | "All Rights Reserved" | "All Rights Reserve" (as shown) |

### 404 Page (Current vs Figma)

| Element | Current | Figma Design |
|---------|---------|--------------|
| Layout | Single column, centered emoji placeholder | 2-column: left text+search, right valve product image |
| Image | Emoji 🔧 placeholder in grey box | Real industrial valve/actuator product collage image |
| Header/Footer | Imports own Header+Footer (duplicate with PublicLayout) | Uses PublicLayout (no duplicate) |
| WhatsApp FAB | Missing | Green WhatsApp floating button bottom-right |

## Plan

### 1. Contact Us Page (`src/pages/Contact.tsx`)
- Change title to "CONTACT US"
- Remove subtitle paragraph
- Restructure to 2-column: left contact info (no card), right form
- Contact info sections: "Call us:" (Tel 049.8016529 – Fax 049.8016551), "Contact us on WhatsApp:" (+39 333.8933395), "Mail us:" (info@dinafluid.it), "Position:" (Via De Gasperi, 6 Z.i. Saccolongo (PD))
- Form fields: Name + Surname (2-col), Mail + Telephone (2-col), Message (full width)
- Labels styled with `text-primary font-semibold`
- Submit button: primary blue, uppercase "SEND", no icon
- Add Google Maps iframe embed below the form section (full width, showing Saccolongo PD location)
- Keep existing `quote_requests` insert logic but map new fields

### 2. 404 Page (`src/pages/NotFound.tsx`)
- Remove duplicate Header/Footer imports (it renders inside PublicLayout via the `*` route)
- Change layout to 2-column grid: left = text + search, right = product image
- Use one of the existing uploaded product images or copy the valve collage image for the right side

### 3. WhatsApp Floating Button (new shared component)
- Create `src/components/shared/WhatsAppFAB.tsx` — green circle, fixed bottom-right, links to `https://wa.me/393338933395`
- Add to `PublicLayout.tsx` so it appears on all public pages

### 4. Footer Updates (`src/components/layout/Footer.tsx`)
- Update email to `info@dinafluid.it`
- Update address to `Via De Gasperi, 6 Z.i. Saccolongo (PD)`
- Update fax to `049.8016551`
- Update copyright text to `All Rights Reserve`

### Files to modify
| File | Change |
|------|--------|
| `src/pages/Contact.tsx` | Full redesign to match Figma |
| `src/pages/NotFound.tsx` | Remove duplicate header/footer, 2-column layout with image |
| `src/components/shared/WhatsAppFAB.tsx` | New floating WhatsApp button |
| `src/components/layout/PublicLayout.tsx` | Add WhatsAppFAB |
| `src/components/layout/Footer.tsx` | Update contact details |

