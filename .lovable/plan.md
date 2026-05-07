# Language switcher + per-domain SEO fix

## 1. Move language switcher between Search and Sign-in

Currently the IT/EN flags sit in the small grey top contact bar. Move them into the main blue header row, positioned between the search bar and the Sign-in button — exactly where the user wants them.

**File: `src/components/layout/Header.tsx`**
- Remove the flag block from the top contact bar.
- Add a new compact language pill in the main header, placed right before the Sign-in / User menu group:
  - Two buttons: 🇮🇹 IT and 🇬🇧 EN, separated by a divider, rounded pill, light background so it stands out on the blue header.
  - Active language: solid white background + primary text color.
  - Inactive language: transparent + white text, hover lightens.
- Behavior:
  - On production (`nexfluid.it` / `nexfluid.com`): clicking a flag navigates to the other domain at the **same path** (e.g. `/categories/valves`) so users land on the translated equivalent.
  - On preview (`*.lovable.app` / `localhost`): the production domains are not reachable, so clicking instead calls `i18n.changeLanguage('it'|'en')` locally so the user can preview both languages without leaving the sandbox.
  - Detect environment with `window.location.hostname`.
- Mobile: keep the same pill visible (it's small enough), or move it into the mobile search row.

## 2. Make the switcher work reliably

Right now `src/lib/i18n.ts` hard-codes the preview/localhost to English. That fights with manual switching. Update so:
- Initial language is still derived from the domain (IT for `.it`, EN for `.com`, EN default on preview).
- Once the user clicks a flag on preview, `i18next` actually changes language and React re-renders. (Currently it would, but the component doesn't call `changeLanguage` — it only links to a domain.) The new pill will call `i18n.changeLanguage` on preview.

## 3. Per-domain SEO — making Google show the right language for each domain

This is the hard part. Lovable serves a single SPA bundle for both `nexfluid.it` and `nexfluid.com`, so the **initial HTML is identical** before JavaScript runs. Google does render JS, but it indexes the first HTML response strongly and can mix things up — exactly what's happening in the screenshots.

We will make the per-domain swap as aggressive and crawler-friendly as possible:

**File: `index.html`**
- The inline domain-detect script already swaps `<title>`, description, OG tags when host is `nexfluid.com`. Move this script to run **before** any other head content that depends on it, and also:
  - Update the `<html lang>` attribute (already done).
  - Update the canonical link to the matching domain (already done).
  - Update `og:url`, `og:locale`, hreflang order so the **self-referencing hreflang** for the current domain comes first.
  - Update the JSON-LD `Organization` and `WebSite` blocks so `url`, `logo`, and `potentialAction.target` use `nexfluid.com` when on `.com`. Currently both JSON-LD blocks hard-code `nexfluid.it`, which tells Google "this site is nexfluid.it" even on the .com domain — a major confusion signal. We will rewrite the JSON-LD via the same inline script when on `.com`.
  - Add `<meta http-equiv="content-language" content="en">` swap for `.com`.

**File: `public/robots.txt` and sitemaps**
- Verify `public/sitemap.xml` and `scripts/generate-sitemap.mjs` emit **two URL sets** with proper `<xhtml:link rel="alternate" hreflang="it"|"en">` entries for every page — one URL per domain. If only `.it` URLs are listed today, `.com` will struggle to get indexed properly. Update the generator to emit both.

**File: `src/lib/i18n.ts`**
- No change to the detector — domain-based detection is already correct for production.

## 4. What you need to do on your side (Google Search Console)

After we deploy:
1. In **Google Search Console**, make sure both `https://nexfluid.it` and `https://nexfluid.com` are added as **separate properties** (Domain or URL-prefix).
2. For each property: open **URL Inspection** → paste the homepage → click **Request Indexing**. Repeat for 3-5 key pages (categories, about, contact).
3. Submit the sitemap on each property: `https://nexfluid.it/sitemap.xml` on the .it property, `https://nexfluid.com/sitemap.xml` on the .com property.
4. Wait 1–3 weeks. Google's index of the wrong-language description will refresh on its own once it re-crawls and sees the corrected per-domain meta + JSON-LD + hreflang signals.

There is no way to force Google to refresh faster than this — even big sites wait days. The technical signals on our side will be 100% correct after this change; the rest is patience + the indexing requests above.

## Technical summary

- Header.tsx: relocate language switcher to between SearchAutocomplete and the Sign-in button; behavior branches on hostname (prod = navigate to other domain, preview = `i18n.changeLanguage`).
- index.html: extend the host-detect inline script to also rewrite the two JSON-LD blocks and add `content-language` for `.com`.
- scripts/generate-sitemap.mjs + public/sitemap.xml: emit both `nexfluid.it` and `nexfluid.com` URLs with mutual `hreflang` alternates.
- No DB or backend changes.

After approval I'll implement all of the above in one pass.