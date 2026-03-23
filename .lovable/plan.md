

# Extract & Insert Technical Details for 2,616 Products

## Current State

| Category | Count |
|----------|-------|
| Products with `product_attributes` rows | 775 |
| Products with specs embedded in `description_original` text (parseable) | 2,616 |
| Products with no specs data anywhere | 523 |
| **Total published** | **3,914** |

## Approach

Run a script that:

1. **Fetches** all 2,616 products that have "Product Specifications" in `description_original` but no rows in `product_attributes`
2. **Parses** specs using regex — the format is consistent: `Working Pressure Max (bar)8.5Voltage110V AC...` — key-value pairs concatenated without delimiters
3. **Validates** each extracted spec: key must be a recognizable attribute name (not garbage), value must be non-empty
4. **Inserts** validated specs into `product_attributes` table with proper `attribute_name`, `attribute_value`, `attribute_unit` fields

For the 523 products with **no specs anywhere** — these genuinely don't have technical data in the source. We will NOT fabricate specs, as that would create inaccurate product data.

## Parsing Logic

The `description_original` contains patterns like:
```
Working Pressure Max (bar)8.5Working Pressure Min (bar)0.35 Voltage110V ACBody MaterialAluminium
```

The regex splits on known attribute name patterns (capitalized words, optional unit in parentheses) followed by their values. This matches the format already used by the 775 products that have `product_attributes`.

## Execution

- Script runs via `lov-exec` using `psql` for bulk reads and the Supabase client for inserts
- Process in batches of 100 to avoid timeouts
- Log progress and any parse failures

## Safety

- Only genuine data from source pages — no AI-generated or fabricated specs
- Skip any product where parsing produces fewer than 2 valid attributes (likely a parsing error)
- Dry-run count check before committing

