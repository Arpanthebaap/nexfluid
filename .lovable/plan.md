

# Fix Header to Match Screenshot Design

## Screenshot Analysis

The screenshot shows a **two-row header**:

1. **Top contact bar**: Light grey/neutral background (NOT blue, NOT green), with phone and email displayed as green pill-shaped buttons on the right side, separated by a `|` divider.
2. **Main header row**: Deep blue/primary background with the Nexfluid logo on the left, a search bar in the center (white input with a blue search icon button on the left), and "Sign in" on the right.

## Current Issues

- The top contact bar has `bg-primary` (blue) background — should be a **light grey** (`bg-gray-200` or similar neutral tone matching the screenshot)
- The green pill buttons and separator look correct but sit on the wrong background color

## Changes

### `src/components/layout/Header.tsx`
- Change the top bar wrapper from `bg-primary` to `bg-gray-200` (light grey background matching the screenshot)
- Keep the green pill-style phone/email buttons as they are (they match the screenshot)
- Keep the `|` separator between them

No other changes needed — the main header row and search bar already match.

### Files to modify
| File | Change |
|------|--------|
| `src/components/layout/Header.tsx` | Top bar background: `bg-primary` → `bg-gray-200` |

