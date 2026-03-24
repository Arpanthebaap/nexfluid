

# Master Plan: What's Next

## Status Check

**DONE**: Phases 1-4, 6, and most of Phase 5 (trust strip, breadcrumbs, category filters, SEO meta tags, schema.org, related products, search autocomplete, branded product images)

**REMAINING** (in priority order):

| Item | Phase | Business Impact |
|------|-------|-----------------|
| Quote email notifications | 5 | HIGH — without this, quote requests sit in DB and nobody gets notified |
| Sitemap.xml generation | 7 | HIGH — Google can't discover 85k+ products without a sitemap |
| Search results pagination | 5 | MEDIUM — currently capped at 50 results with no pagination |
| ProductListing page (unused?) | 5 | LOW — Categories.tsx already handles product listing |

## Recommendation: Move Forward Now

The product import pipeline is running. Content is being added. The two highest-impact items remaining are **quote email notifications** and **sitemap generation** — both are backend-only and don't block anything else.

## Plan: Quote Email Notifications + Sitemap

### 1. Quote Email Notification Edge Function
Create `supabase/functions/quote-notify/index.ts`:
- Triggered by a database webhook (or called from frontend after successful insert)
- Sends email to `info@nexfluid.it` with quote details (customer name, email, product code, quantity, message)
- Uses Resend or built-in SMTP
- Update `Contact.tsx` and `ProductDetail.tsx` quote forms to invoke this function after successful DB insert

### 2. Sitemap Generation Edge Function
Create `supabase/functions/generate-sitemap/index.ts`:
- Queries all published products and active categories
- Generates XML sitemap with proper `<url>`, `<lastmod>`, `<changefreq>`, `<priority>` tags
- Returns XML response directly (can be called from `https://[project].supabase.co/functions/v1/generate-sitemap`)
- Add `robots.txt` update pointing to sitemap URL

### 3. Search Results Pagination
- Add pagination to `SearchResults.tsx` (same pattern as Categories page)
- Add count query and page navigation

### Files to Create/Edit

| File | Change |
|------|--------|
| `supabase/functions/quote-notify/index.ts` | NEW — email notification on quote submission |
| `supabase/functions/generate-sitemap/index.ts` | NEW — dynamic XML sitemap for all products + categories |
| `public/robots.txt` | Add sitemap URL |
| `src/pages/Contact.tsx` | Call quote-notify after successful insert |
| `src/pages/ProductDetail.tsx` | Call quote-notify after successful insert |
| `src/pages/SearchResults.tsx` | Add pagination |

