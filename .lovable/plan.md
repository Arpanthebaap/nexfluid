# Fix: Google showing wrong-language description per domain

## Root cause (short)

Both `nexfluid.it` and `nexfluid.com` serve the **same** `index.html`. The raw bytes Googlebot fetches contain Italian title/description/JSON-LD. The current JS swap only runs after first-pass indexing, so Google has cached crossed snippets and is treating the two domains as a duplicate cluster.

We can't run two separate builds on Lovable hosting, but we can make the per-domain swap happen **before any meta tag is parsed for indexing** and remove the hardcoded language bias from the raw HTML so neither domain has a "default" language baked in.

## Changes

### 1. `index.html` — neutralize raw HTML, swap synchronously before first paint

- Remove hardcoded Italian values from raw HTML for the tags Google reads:
  - `<title>` → empty placeholder filled by inline script.
  - `<meta name="description">` → empty.
  - `<meta property="og:title">`, `og:description`, `og:url`, `og:locale`, `og:image` → empty.
  - `<meta name="twitter:title">`, `twitter:description`, `twitter:image` → empty.
  - `<html lang>` → no value (set by script).
  - The two `<script type="application/ld+json">` blocks → **remove from raw HTML entirely**. Inject them dynamically from the inline script using the correct domain.
- Move the inline detection script to be the **very first** thing in `<head>` (right after `<meta charset>` and viewport), so it runs before Googlebot parses any meta tag.
- Script logic:
  - Detect host: `nexfluid.com` / `www.nexfluid.com` → English; everything else (`nexfluid.it`, preview, localhost) → Italian, except preview defaults to English for QA.
  - Set `document.documentElement.lang`, `<title>`, all meta descriptions/OG/Twitter, canonical, hreflang order (self-referencing first).
  - `document.write` (or `document.head.insertAdjacentHTML('beforeend', …)`) the JSON-LD block with the matching domain — only one block written, never both.
  - Add `<meta http-equiv="content-language">` matching the chosen language.
- Keep the existing static `<link rel="alternate" hreflang>` tags (they stay valid for both languages).

### 2. `public/robots.txt` — declare both sitemaps

Ensure it lists:
```
Sitemap: https://nexfluid.it/sitemap.xml
Sitemap: https://nexfluid.com/sitemap.xml
```
(Lovable serves the same file from both hosts; that's fine — Google reads the file on whichever host it's fetching.)

### 3. `scripts/generate-sitemap.mjs` — emit both-domain entries (verify)

Currently each `<url>` lists only `<loc>` on `.it` with `hreflang` alternates. For maximum disambiguation, emit **separate `<url>` entries for `.com` and `.it`** for every page, each self-referencing in its own `<loc>`, with mutual hreflang. This tells Google the two domains are distinct language versions, not duplicates.

### 4. No code change needed in `src/lib/i18n.ts`

Domain detector already correct.

## What you must do in Google Search Console (required)

These technical changes won't refresh Google's cache instantly — the snippet you see in screenshots is cached. After we deploy:

1. **Both properties must exist separately**: `https://nexfluid.it` and `https://nexfluid.com` as two URL-prefix properties.
2. For **each** property → **Removals** → **Outdated content** → submit the homepage URL. This forces Google to drop the cached snippet within ~24h.
3. For **each** property → **URL Inspection** → paste homepage → **Request Indexing**. Repeat for `/categories`, `/about`, `/contact`.
4. Submit `sitemap.xml` on each property.
5. Wait 3–10 days. Google will re-crawl, see the now-correct per-domain raw HTML, and rebuild snippets cleanly. The duplicate-cluster grouping will dissolve once each domain has distinct first-pass HTML.

There is no way to force this faster — even after our fix, the Removals + Request Indexing combo is what makes Google refresh in days instead of weeks.

## Files touched

- `index.html` — strip language-biased hardcoded tags, move/extend inline domain script, dynamic JSON-LD injection.
- `public/robots.txt` — verify both sitemaps listed.
- `scripts/generate-sitemap.mjs` — emit per-domain `<url>` entries (one for `.it`, one for `.com`) with mutual hreflang.

No DB, auth, or component changes. Approve and I'll implement in one pass.
