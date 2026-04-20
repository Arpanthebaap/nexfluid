

## Problem

The 166 re-parented categories (and ~152 other older orphans — 318 total leaf-L2s) currently sit at **depth 2** directly under L1 sub-categories. The correct catalog depth for end-categories is **depth 3**, sibling to existing series-level leaves like `Series 307 Push Button Valves` which lives under `Valves > Manually Operated Valves > Manually Operated > Series 307…`.

Example of the mismatch under `Manually Operated Valves`:

```text
GOOD (depth 3 — where series-level end-categories belong)
  valves > manually-operated-valves > manually-operated > series-307-push-button-valves-22mm-panel-mount
  valves > manually-operated-valves > manually-operated > series-310-push-button-valves
  valves > manually-operated-valves > mechanically-operated > series-309-roller-pilot-valves-4mm

BAD (depth 2 — orphan leaves that need to be moved one level deeper)
  valves > manually-operated-valves > series-408-manual-reset-valves          ← move under "manually-operated"
  valves > manually-operated-valves > series-vl-vt-manually-operated-lockout-valves
  valves > manually-operated-valves > series-551-552-lever-valves
  valves > manually-operated-valves > valvole-a-controllo-manuale-per-pneumatica
```

## Scope

| L1 parent | Orphan leaf-L2s to re-home |
|---|---:|
| pneumatic-cylinders-actuators | 50 |
| solenoid-valves | 46 |
| proportional-valves | 43 |
| pneumatic-air-preparation | 33 |
| vacuum-components | 27 |
| valve-systems | 25 |
| pinch-valves | 18 |
| hydraulic-fittings-tubing | 13 |
| pneumatic-valves (under valves) | 13 |
| hydraulic-valves-manifolds-1 | 10 |
| pneumatic-valves-1 (under pneumatic) | 10 |
| sensors-switches | 7 |
| manually-operated-valves | 6 |
| pneumatic-connectors-fittings-hose | 5 |
| hydraulic-fluids-filtration | 4 |
| hydraulic-instrumentation-switches | 4 |
| hydraulic-cylinders-pumps-power-units | 2 |
| pneumatic-hydraulic-pressure-gauges | 1 |
| pneumatic-counters-logic-controllers-timers | 1 |
| **Total** | **318** |

Products attached to these 318 categories keep their `category_id` — only the category's `parent_id` moves.

## Approach

For each orphan leaf-L2, pick the best **grouping-L2 sibling** (same L1, has children) by keyword scoring on slug + `name_en`, then re-parent.

### Classification rules (per L1)

```text
manually-operated-valves:
  hand|foot|lever|pulsante|push-button|panel|spool|reset|lockout|hand or foot|valvole-…manuale  → manually-operated
  roller|cam|stem|mechan                                                                          → mechanically-operated

solenoid-valves:
  coil                                            → coils
  cryogen|lt-                                     → cryogenic-service-valves
  dust|pulse|tank|c20|353|355|357|110            → dust-collector-valves
  atex|explosion|flameproof|126|195|215|262-263  → explosion-proof-valves-atex
  general/process/direct/pilot/diaphragm/poppet  → general-purpose-solenoid-valves
  (else)                                         → general-purpose-solenoid-valves (default)

pneumatic-cylinders-actuators:
  iso-15552|iso-6432|tie-rod|167|trb|its|ccl     → tie-rod-cylinders / iso-cylinders (best match)
  diaphragm|piston-actuator|rdc                  → diaphragm-piston-actuators
  rotary|rack-pinion|swivel                      → rotary-actuators
  compact|short-stroke                           → compact-cylinders
  guide|guided                                   → guided-cylinders
  (else)                                         → pneumatic-cylinder-accessories

pneumatic-air-preparation:
  filter-regulator-lub|frl                       → filter-regulator-lubricators
  filter-regulator                               → filter-regulators
  filter (alone)                                 → pneumatic-filters
  regulator                                      → pneumatic-regulators
  lubricator                                     → pneumatic-lubricators
  dryer                                          → pneumatic-air-dryers
  element|cartridge                              → pneumatic-replacement-filter-elements
  (else)                                         → air-preparation-accessories

(similar deterministic keyword rules for the other 14 L1s, using their existing grouping-L2 children as targets)
```

For any L1 that has **no** existing grouping-L2 (very rare — found only on small branches like `pinch-valves`), create a single curated grouping L2 (e.g. `pinch-valve-series`, `proportional-valve-series`) and dump its orphans under it. This keeps depth = 3 everywhere.

### Execution steps

1. **Snapshot** — read all 318 orphan leaves + existing grouping-L2 IDs per L1 (one read query).
2. **Classify** in a Node script using the keyword tables above; produce `(leaf_id → new_l2_parent_id)` mapping.
3. **Sanity preview** — print first ~5 mappings per L1 + count of unmatched defaults.
4. **Bulk re-parent** — grouped `UPDATE categories SET parent_id = $new WHERE id IN (…)` per target.
5. **Image refresh** — recursive ancestor-image SQL so the moved leaves inherit the new closest L2 image.
6. **Verify** — `SELECT COUNT(*) FROM tree WHERE depth = 2 AND no children` should drop from 318 → 0; depth-3 count rises by 318.

## Result

- All series-level end-categories live at the correct depth (3 levels under root, matching `Series 307…` example).
- Breadcrumbs become consistent 4-level: `Home > Valves > Manually Operated Valves > Manually Operated > Series 408 Manual Reset Valves`.
- Zero product downtime — `category_id` references untouched.
- Sidebar navigation under each L1 cleans up: only true grouping L2s show as expandable, no flat clutter.
- 11,915+ products keep working URLs.

## Files / Operations

| Operation | Target |
|-----------|--------|
| Read | `categories` (snapshot orphan leaves + grouping L2s) |
| Update | `categories.parent_id` for 318 rows (data op via insert/update) |
| Update | `categories.image_url` recursive refresh for moved subtree |
| Verify | depth-distribution query confirming 0 leaf-L2s remain |

