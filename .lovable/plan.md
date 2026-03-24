

# Update Favicon & Browser Tab Branding

## Changes

### 1. Set Nexfluid Logo as Favicon
- Copy the existing Nexfluid logo (`public/lovable-uploads/04244b88-7e59-4987-9f7a-81be85561eac.png`) to `public/favicon.png`
- Add `<link rel="icon">` tag in `index.html`
- Add Apple touch icon for iOS bookmarks

### 2. Fix Title & SEO in `index.html`
- Remove the `<!-- TODO -->` comment
- Title is already "Nexfluid — Automation in Stock" (good, includes brand + tagline)
- Add `<link rel="canonical">` 
- Add structured data (Organization schema) for Google Knowledge Panel
- Add `hreflang` tags for IT/EN

### 3. Google Algorithm Best Practices
- Title format: `Brand — Tagline` (already correct, under 60 chars)
- Meta description under 160 chars with keywords (already good)
- Add `robots` meta tag allowing indexing
- Add Organization JSON-LD schema markup

### File: `index.html`

```html
<!-- Remove TODO comment -->
<!-- Add favicon link -->
<link rel="icon" href="/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="/favicon.png">
<link rel="canonical" href="https://nexfluid.it">
<link rel="alternate" hreflang="it" href="https://nexfluid.it">
<link rel="alternate" hreflang="en" href="https://nexfluid.it">
<meta name="robots" content="index, follow">

<!-- Organization structured data for Google -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Nexfluid",
  "url": "https://nexfluid.it",
  "description": "Industrial automation components distributor"
}
</script>
```

Single file edit + one file copy.

