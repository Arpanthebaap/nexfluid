

# Fix Header to Match Figma Screenshot

## Differences Found

| Element | Current | Screenshot Design |
|---------|---------|-------------------|
| Top contact bar background | `bg-primary` (blue) | Green/teal color (`#16a34a` or similar) |
| Email address | `info@nexfluid.it` | `info@dinafluid.it` |
| Phone text | `049.8016529` | `Tel 049.8016529` with "Tel" prefix |
| Separator | Gap spacing only | Visual `|` separator between phone and email |
| Search icon | Small grey muted icon | Larger blue/primary search icon inside a blue circle/bg on the left |
| Search bar | Rounded with grey icon | White background, rounded, with a prominent blue search icon button on left |

## Changes

### 1. Header top bar (`src/components/layout/Header.tsx`)
- Change top bar from `bg-primary` to `bg-green-600` (green background matching screenshot)
- Update email to `info@dinafluid.it`
- Add "Tel" prefix before phone number
- Add `|` separator between phone and email

### 2. Search bar styling (`src/components/shared/SearchAutocomplete.tsx`)
- Make the search icon larger and styled with a primary-blue circular background on the left side of the input, matching the screenshot's prominent blue search icon

### Files to modify
| File | Change |
|------|--------|
| `src/components/layout/Header.tsx` | Green top bar, update email, add Tel prefix, add separator |
| `src/components/shared/SearchAutocomplete.tsx` | Prominent blue search icon styling |

