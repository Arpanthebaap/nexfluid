

# Import Full Category Hierarchy from Spreadsheet

## Analysis Summary

The Excel file has **5 sheets** with a clear structure:

- **Sheet 1**: Valves Direct / Emerson categories (detailed 4-level hierarchy)
- **Sheet 2**: RS Online categories (additional hydraulic, pneumatic, vacuum sub-categories)
- **Sheet 3**: Master mapping showing the 4 super-categories and source attribution
- **Sheet 4**: Final combined menu structure (the definitive hierarchy to implement)
- **Sheet 5**: Brand list (Parker, Asco, Joucomatic, Emerson, Aventics, Numatics, Sirai)

### Key Finding

The spreadsheet confirms the **4 existing top-level categories are correct** (Valves, Hydraulic, Pneumatic, Vacuum). What's missing is the rich sub-category hierarchy beneath them. Sheet 3 shows some categories appear under multiple super-categories (e.g., "Hydraulic Valves & Manifolds" under both Valves and Hydraulic, "Pneumatic Valves" under both Valves and Pneumatic). Sheet 4 is the final merged menu.

## Structure to Import

```text
VALVES (existing — keep)
├── Manually Operated Valves (+ 2 children, each with series)
├── Pinch Valves (18 series)
├── Proportional Valves (40 series)
├── Seat Valves (3 children with series)
├── Solenoid Valves (9 children, some with 4th-level)
├── Valve Systems (7 children with series)
├── Hydraulic Valves & Manifolds (5 children)
├── Pneumatic Valves (6 children)
└── Sensors & Switches (5 children with series)

HYDRAULIC (existing — keep)
├── Hydraulic Fittings & Tubing (5 children, deep nesting)
├── Hydraulic Fluids & Filtration (5 children)
├── Hydraulic Instrumentation & Switches (2 children)
├── Hydraulic Cylinders, Pumps & Power Units (2 children)
└── Hydraulic Valves & Manifolds (5 children — shared with Valves)

PNEUMATIC (existing — keep)
├── Pneumatic Air Preparation (8 RS Online children + 2 Valves Direct children)
├── Pneumatic Cylinders & Actuators (3 RS children + Valves Direct cylinder hierarchy)
├── Pneumatic & Hydraulic Pressure Gauges (3 children)
├── Pneumatic Connectors, Fittings & Hose (4 children)
├── Pneumatic Counters, Logic Controllers & Timers (2 children)
└── Pneumatic Valves (6 children — shared with Valves)

VACUUM (existing — keep)
└── Vacuum Components (16 children including Vacuum Technologies series)
```

**Total**: ~450+ category nodes across 4 levels.

## What Will Be Done

### 1. Database: Insert full hierarchy under existing 4 top-level categories
- Keep the 4 existing parent categories (Valves, Hydraulic, Pneumatic, Vacuum) with their current IDs and images
- Insert all sub-categories from Sheet 4 (the merged menu) with proper parent_id references
- Auto-generate slugs from English names
- Set Italian names = English names initially (admin can translate later)
- Handle shared categories: "Hydraulic Valves & Manifolds" and "Pneumatic Valves" appear under multiple parents — will be inserted once under their primary parent, with the other parent linking via the same slug

### 2. Generate category images for Level-2 categories
- Create images for the ~25 second-level categories (e.g., Solenoid Valves, Hydraulic Fittings & Tubing, etc.)
- Top-level images already exist

### 3. Update homepage to show Level-2 categories
- Instead of showing only 4 top-level cards, show them as expandable sections or a grouped grid so users can navigate directly to sub-categories

### 4. Update sidebar navigation
- Already dynamic — will automatically reflect new hierarchy
- May need to handle the deeper nesting (4 levels) gracefully

## Technical Approach

1. Parse the Sheet 4 data into a hierarchical insert script
2. Use the Supabase insert tool to execute ~450 INSERT statements in batches (parents first, then children)
3. Generate AI images for Level-2 categories
4. Adjust homepage layout for grouped category display

## Files to Modify
- Database: INSERT ~450 category rows (keeping existing 4 top-level)
- `src/pages/Index.tsx` — grouped category display
- `src/pages/Categories.tsx` — handle deeper nesting
- `src/components/shared/BrandsSidebar.tsx` — handle 4-level depth
- `public/categories/` — new images for Level-2 categories

