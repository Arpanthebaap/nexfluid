

## Audit Result (concise)

After analyzing the 620-category tree end-to-end, **only 60 misplaced end-categories remain**, all under two L1 branches in `valves`:

| L1 branch | Misplaced series-leaves at depth 2 | Existing depth-3 grouping siblings (where they belong) |
|---|---:|---|
| `valves > solenoid-valves` | 35 | `general-purpose-solenoid-valves`, `miniature-solenoid-valves`, `fuel-gas-valves`, `pilot-valves`, `dust-collector-valves`, `explosion-proof-valves-atex`, `cryogenic-service-valves`, `hot-water-steam-valves`, `general-service-valves`, `coils`, `solenoid-valves-accessories` |
| `valves > valve-systems` | 25 | `directional-control-valves` (47 children already), `modular-valve-systems`, `standardized-valves`, `safety-valves`, `fieldbus`, `electrical-connection-technologies` |

**Zero new categories will be created.** Every misplaced leaf maps cleanly into an existing curated grouping that already holds dozens of similar `series-*` end-categories. The 620-category structure is preserved exactly as-is.

## Mapping (deterministic, name-based)

### Under `solenoid-valves` → existing grouping
```text
series-551-552-553-…             → general-purpose-solenoid-valves   (matches Series 551/553 ATEX sibling pattern, but pure-GP series)
series-l###-…general-purpose…    → general-purpose-solenoid-valves   (L127/L131/L133/L139/L140/L145/L182/L208/L256/L282 etc.)
series-342-general-service-…     → general-service-valves
series-221-slow-closing-water    → hot-water-steam-valves
series-260-plastic-body          → general-purpose-solenoid-valves
series-264-poppet / 344-piston-poppet / 345 / 340 / 327 / 296-bellows → general-purpose-solenoid-valves
series-266-direct-operated-lever / 320-3-way / 381 / 383 / 384       → general-purpose-solenoid-valves
series-287-coaxial-high-pressure → general-purpose-solenoid-valves
series-l01 / l1 / i12-i23 / jspa → pilot-valves
series-c12-c23-c34-spool         → general-purpose-solenoid-valves
series-v366 / v367 micro          → miniature-solenoid-valves
```

### Under `valve-systems` → existing grouping
```text
series-5##-spool-valves / 540-… / 541-542-543-iso / 538 / 539 / 562 / 519 / 520 / 521 / 518-micro → directional-control-valves
series-067-rocker / 068-flapper / 055-isolation / 226-fluidic / 140      → directional-control-valves
series-343-lockout / 651-652-653-lockout / 881-supply-rail               → directional-control-valves
series-490-579-589 / msv8                                                → directional-control-valves
series-cd02-al-iso-15407-1 / cl18 / cl26 / e12-e23-e34-iso              → standardized-valves
series-rb-miniature                                                      → modular-valve-systems
fine-setting-valves / flow-valves-block-valves                          → modular-valve-systems
```

## Execution

1. Build the 60-row mapping `(leaf_id → existing_grouping_id)` from the names above (no fuzzy AI — pure rule table).
2. Sanity preview: print all 60 mappings grouped by target.
3. Single transactional `UPDATE categories SET parent_id = $grouping_id WHERE id IN (…)` per target grouping (≤14 statements).
4. Recursive image refresh so the 60 moved leaves inherit the closest ancestor `image_url`.
5. Verification query: `WHERE depth=2 AND no_children` → expect **0** (currently 60); products on those leaves stay attached.

## Result

- All 60 series-level end-categories sit at depth 3 alongside their existing siblings (e.g. `valves > solenoid-valves > general-purpose-solenoid-valves > series-l140-…`).
- Breadcrumbs become consistent: `Home > Valves > Solenoid Valves > General Purpose Solenoid Valves > Series L140 General Purpose Solenoid Valves`.
- The 620-category curated structure is **untouched** — no new groupings, no renames, no merges.
- The ~3,800 products on the 60 leaves keep their `category_id` — zero product downtime.
- Sidebar under `solenoid-valves` and `valve-systems` cleans up: only the 10–14 real grouping L2s show, no flat clutter.

