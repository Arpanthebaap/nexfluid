

# Categorize All 3,975 Uncategorized Products

## Problem

Out of 12,091 published products, **3,975 have no category_id** — they're invisible in category and brand drill-down navigation.

| Brand | Uncategorized |
|-------|--------------|
| ASCO | 2,436 |
| AVENTICS | 1,331 |
| NUMATICS | 166 |
| PARKER | 37 |
| JOUCOMATIC | 3 |
| EMERSON | 2 |

## Root Cause

These products were imported before the full category hierarchy was built, and the URL-based slug matching in the import pipeline didn't find matches because the exact URL slugs (e.g., `series-551-552-553-solenoid-valves`) don't exist as category slugs.

## Solution

Create new end-sub-categories for ~200 distinct URL slugs and assign products to them. The approach:

### Step 1: Create ~200 new end-sub-categories

Each uncategorized product's source URL contains a slug (e.g., `series-cd07-directional-valves`). These will become new leaf categories under the correct parent:

| URL Pattern | Parent Category | Products |
|-------------|----------------|----------|
| `*solenoid-valve*` | Solenoid Valves | ~2,300 |
| `*directional-valve*` | Directional Control Valves | ~700 |
| `*cylinder*`, `*actuator*`, `*bellows*`, `*guide*`, `*rodless*` | Pneumatic Cylinders & Actuators | ~280 |
| `*coil*` | Solenoid Coils | 49 |
| `*vacuum*` | Vacuum Components | 23 |
| `*filter*`, `*regulator*`, `*lubricator*`, `*air-preparation*` | Pneumatic Air Preparation | ~30 |
| `*sensor*`, `*proximity*`, `*pressure-switch*`, `*field-bus*` | Sensors & Switches | ~70 |
| `*check*`, `*choke*`, `*non-return*`, `*exhaust*`, `*stop*`, `*lockout*` | Pneumatic Valves | ~100 |
| `*lever*`, `*hand-or-foot*` | Manually Operated Valves | ~15 |
| `*gauge*` | Pressure Gauges | ~4 |
| `*fitting*`, `*mounting*`, `*clevis*` | Connectors & Fittings | ~20 |
| `*supply-rail*`, `*valve-system*`, `*iso-15407*` | Valve Systems | ~75 |
| Other valve-related | Pneumatic Valves | ~86 |

### Step 2: Assign products to new categories

For each new category, update all matching products' `category_id` using the URL slug pattern.

### Step 3: Handle 37 Parker products from RS-Online

These have different URL patterns (rs-online.it). Use product name keywords (solenoid → Solenoid Valves, hydraulic fitting → Hydraulic Fittings, etc.) to assign them.

## Technical Implementation

1. **Edge function or migration script** that:
   - Queries all distinct URL slugs for uncategorized products
   - Creates new category rows under the appropriate parent
   - Updates products with the new category IDs
   - Handles the 37 RS-Online products via name-based matching

2. This will be implemented as a **database migration** with INSERT for new categories and UPDATE for product category assignments.

## Expected Outcome

- All 3,975 products get assigned to specific end-sub-categories
- ~200 new leaf categories created (e.g., "Series CD07 Directional Valves" under "Directional Control Valves")
- Brand pages will show complete product counts
- Category navigation will surface all products

## Files to modify
| File | Change |
|------|--------|
| New migration | Create ~200 new subcategories + UPDATE products to assign category_id |

