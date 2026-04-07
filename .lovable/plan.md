

# Fix Domain-Based Language Detection for Policy Pages (and entire site)

## Problem

The i18n detection order is `['querystring', 'localStorage', 'navigator']` — it never checks the domain. So visitors to `nexfluid.com` see Italian content unless they manually switch or their browser language is English.

## Solution

Add a custom language detector in `src/lib/i18n.ts` that checks `window.location.hostname`:
- `nexfluid.com` or `www.nexfluid.com` → `en`
- `nexfluid.it` or `www.nexfluid.it` → `it`
- Other (localhost, preview) → fall through to existing detectors

This fixes language for **all pages** (including Privacy Policy and Cookie Policy), not just the policy pages.

## Technical Details

The `i18next-browser-languagedetector` supports custom detectors. We add a `domainDetector` that reads the hostname and put it **first** in the detection order, so domain always wins over localStorage/navigator.

## Files to modify

| File | Change |
|------|--------|
| `src/lib/i18n.ts` | Add custom domain-based detector, put it first in detection order |

