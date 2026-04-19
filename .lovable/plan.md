

## Goal

Re-home the **166 auto-generated leaf categories** (currently sitting at L1 directly under `pneumatic`/`hydraulic`/`valves`) so they live as proper **end-categories** under one of the existing curated L1 sub-category branches — matching the pattern: `Home > Hydraulic > Hydraulic Fittings & Tubing > Hydraulic Tube`.

The 11,915 products attached to them keep their `category_id` — only the parent of the category itself moves, so URL/breadcrumb depth becomes correct (L0 → L1 → leaf).

## Current State

| Root | Curated L1 branches (with children) | Auto-generated L1 leaves to remap | Products on those leaves |
|---|---:|---:|---:|
| hydraulic | 5 | 25 | 599 |
| pneumatic | 6 | 79 | 7,945 |
| valves | 9 | 62 | 3,371 |
| **Total** | **20** | **166** | **11,915** |

The 20 curated L1 branches already exist (e.g. `Hydraulic Fittings & Tubing`, `Pneumatic Air Preparation`, `Solenoid Valves`, `Pneumatic Cylinders & Actuators`, etc.) — they are the correct destination buckets.

## Mapping Strategy (keyword → curated L1 parent)

Each of the 166 leaves is matched to the best curated L1 by a keyword classifier on its slug/name (English + Italian terms). High-confidence rule examples:

```text
HYDRAULIC root:
  raccordi/fitting/tubi/hose/morsetti/dadi/viti     → Hydraulic Fittings & Tubing
  filtri/elementi-filtranti/sfiato/breather         → Hydraulic Fluids & Filtration
  valvol/ball/check/spillo/non-ritorno/sfera        → Hydraulic Valves & Manifolds
  manometri/sensori/spessimetri/indicatori          → Hydraulic Instrumentation & Switches
  pompe/cilindri/inverter                           → Hydraulic Cylinders, Pumps & Power Units

PNEUMATIC root:
  cilindri/cylinder/actuator/pistoni                → Pneumatic Cylinders & Actuators
  raccord/fitting/tubi/hose/connector               → Pneumatic Connectors, Fittings & Hose
  filtro/lubrifica/regolatori-pressione/aria        → Pneumatic Air Preparation
  valvol/solenoide/distributor                      → Pneumatic Valves
  manometri/pressure-gauge                          → Pneumatic & Hydraulic Pressure Gauges
  timer/contatori/logic                             → Pneumatic Counters, Logic Controllers & Timers

VALVES root:
  solenoid/elettrovalvol                            → Solenoid Valves
  proporzional/proportional                         → Proportional Valves
  manuale/leva/pedale                               → Manually Operated Valves
  pinch/strozzo                                     → Pinch Valves
  sensori/switch/pressostat                         → Sensors & Switches
  sede/seat                                         → Seat Valves
  isole/island/manifold/sistemi                     → Valve Systems
  pneumatic-actuated                                → Pneumatic Valves
  hydraulic                                         → Hydraulic Valves & Manifolds
```

Any leaf the classifier can't confidently match (expected: very few, ~0–5) will be dumped to a curated catch-all on its root (e.g. a new `Other <Root> Components` L1 created once if needed, with image inherited from the root).

## Implementation Steps

1. **Snapshot** — `SELECT id, slug, name_en, parent_id` for the 166 auto-generated L1 leaves into a script.
2. **Classifier pass** — Node/SQL keyword scoring against the 20 curated L1 IDs; produce a mapping table `(leaf_id → new_parent_l1_id)`.
3. **Sanity preview (read-only)** — print first ~10 mappings per root and the unmatched count for verification before write.
4. **Bulk re-parent** — single `UPDATE categories SET parent_id = <new_l1_id> WHERE id IN (...)`.
5. **Image refresh** — re-run the recursive image-inheritance SQL so newly deepened leaves get the closest ancestor `image_url` (most will now inherit from the more specific L1 instead of the root).
6. **Verification** — query: 0 leaves directly under root that have no children (all 166 should now be at L2), plus a depth check on a sampled product breadcrumb.

## Result

- Breadcrumbs become 4-level: `Home > Hydraulic > Hydraulic Fittings & Tubing > Raccordi Per Idraulica` (instead of `Home > Hydraulic > Raccordi Per Idraulica`).
- All 11,915 products keep their `category_id` — zero product downtime, zero re-import.
- Category images stay populated (recursive refresh).
- No new L1s polluting the root navigation; the homepage/root listings stay clean with only the 20 curated sub-category branches visible.

