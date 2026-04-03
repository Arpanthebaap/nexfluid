-- Categorize all 3,975 uncategorized products
-- Creates ~100 new leaf subcategories and assigns products by URL slug matching

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-551-552-553-solenoid-valves', 'Series 551/552/553 Solenoid Valves', 'Series 551/552/553 Solenoid Valves', '2b21c786-354a-4b99-a8c9-59f794206714', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-551-552-553-solenoid-valves' AND parent_id = '2b21c786-354a-4b99-a8c9-59f794206714');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-263-2-way-high-flow-solenoid-valve', 'Series 263 2-Way High Flow Solenoid Valve', 'Series 263 2-Way High Flow Solenoid Valve', '015303b0-a211-4aa4-ab6c-2b2f7a305724', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-263-2-way-high-flow-solenoid-valve' AND parent_id = '015303b0-a211-4aa4-ab6c-2b2f7a305724');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-266-direct-operated-lever-type-solenoid-valves-npt', 'Series 266 Direct Operated Lever Type Solenoid Valves NPT', 'Series 266 Direct Operated Lever Type Solenoid Valves NPT', '2b21c786-354a-4b99-a8c9-59f794206714', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-266-direct-operated-lever-type-solenoid-valves-npt' AND parent_id = '2b21c786-354a-4b99-a8c9-59f794206714');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-i12-i23-direct-solenoid-actuated-valves', 'Series I12/I23 Direct Solenoid Actuated Valves', 'Series I12/I23 Direct Solenoid Actuated Valves', '2b21c786-354a-4b99-a8c9-59f794206714', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-i12-i23-direct-solenoid-actuated-valves' AND parent_id = '2b21c786-354a-4b99-a8c9-59f794206714');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-jspa-heavy-duty-solenoid-pilot-actuated-valves', 'Series JSPA Heavy Duty Solenoid Pilot Actuated Valves', 'Series JSPA Heavy Duty Solenoid Pilot Actuated Valves', '2b21c786-354a-4b99-a8c9-59f794206714', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-jspa-heavy-duty-solenoid-pilot-actuated-valves' AND parent_id = '2b21c786-354a-4b99-a8c9-59f794206714');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-l1-solenoid-pilot-or-air-pilot-actuated-valves', 'Series L1 Solenoid Pilot Or Air Pilot Actuated Valves', 'Series L1 Solenoid Pilot Or Air Pilot Actuated Valves', '2b21c786-354a-4b99-a8c9-59f794206714', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-l1-solenoid-pilot-or-air-pilot-actuated-valves' AND parent_id = '2b21c786-354a-4b99-a8c9-59f794206714');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-l01-direct-solenoid-actuated-valves', 'Series L01 Direct Solenoid Actuated Valves', 'Series L01 Direct Solenoid Actuated Valves', '2b21c786-354a-4b99-a8c9-59f794206714', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-l01-direct-solenoid-actuated-valves' AND parent_id = '2b21c786-354a-4b99-a8c9-59f794206714');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-l2-line-mounted-pneumatic-valves', 'Series L2 Line Mounted Pneumatic Valves', 'Series L2 Line Mounted Pneumatic Valves', 'c2902381-ae2e-4bf2-a922-03f83aad3e76', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-l2-line-mounted-pneumatic-valves' AND parent_id = 'c2902381-ae2e-4bf2-a922-03f83aad3e76');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-222-steam-valves', 'Series 222 Steam Valves', 'Series 222 Steam Valves', '067c4421-ac81-4608-b085-99d98fce488e', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-222-steam-valves' AND parent_id = '067c4421-ac81-4608-b085-99d98fce488e');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-385-micro-solenoid-valves', 'Series 385 Micro Solenoid Valves', 'Series 385 Micro Solenoid Valves', '09b4b5e1-5117-4944-950b-4adc1b933aa0', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-385-micro-solenoid-valves' AND parent_id = '09b4b5e1-5117-4944-950b-4adc1b933aa0');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-c12-c23-c34-solenoid-air-operated-spool-valves', 'Series C12/C23/C34 Solenoid Air Operated Spool Valves', 'Series C12/C23/C34 Solenoid Air Operated Spool Valves', '2b21c786-354a-4b99-a8c9-59f794206714', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-c12-c23-c34-solenoid-air-operated-spool-valves' AND parent_id = '2b21c786-354a-4b99-a8c9-59f794206714');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-cd07-directional-valves', 'Series CD07 Directional Valves', 'Series CD07 Directional Valves', 'f3a2776c-6c2e-43c9-9599-9a4b72893b46', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-cd07-directional-valves' AND parent_id = 'f3a2776c-6c2e-43c9-9599-9a4b72893b46');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-cd04-directional-valves', 'Series CD04 Directional Valves', 'Series CD04 Directional Valves', 'f3a2776c-6c2e-43c9-9599-9a4b72893b46', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-cd04-directional-valves' AND parent_id = 'f3a2776c-6c2e-43c9-9599-9a4b72893b46');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-do-dp-directional-valves', 'Series DO/DP Directional Valves', 'Series DO/DP Directional Valves', 'f3a2776c-6c2e-43c9-9599-9a4b72893b46', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-do-dp-directional-valves' AND parent_id = 'f3a2776c-6c2e-43c9-9599-9a4b72893b46');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-cd12-directional-valves', 'Series CD12 Directional Valves', 'Series CD12 Directional Valves', 'f3a2776c-6c2e-43c9-9599-9a4b72893b46', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-cd12-directional-valves' AND parent_id = 'f3a2776c-6c2e-43c9-9599-9a4b72893b46');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-740-directional-valves', 'Series 740 Directional Valves', 'Series 740 Directional Valves', 'f3a2776c-6c2e-43c9-9599-9a4b72893b46', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-740-directional-valves' AND parent_id = 'f3a2776c-6c2e-43c9-9599-9a4b72893b46');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-st-directional-valves', 'Series ST Directional Valves', 'Series ST Directional Valves', 'f3a2776c-6c2e-43c9-9599-9a4b72893b46', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-st-directional-valves' AND parent_id = 'f3a2776c-6c2e-43c9-9599-9a4b72893b46');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-ls04-directional-valves', 'Series LS04 Directional Valves', 'Series LS04 Directional Valves', 'f3a2776c-6c2e-43c9-9599-9a4b72893b46', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-ls04-directional-valves' AND parent_id = 'f3a2776c-6c2e-43c9-9599-9a4b72893b46');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-wv02-directional-valves', 'Series WV02 Directional Valves', 'Series WV02 Directional Valves', 'f3a2776c-6c2e-43c9-9599-9a4b72893b46', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-wv02-directional-valves' AND parent_id = 'f3a2776c-6c2e-43c9-9599-9a4b72893b46');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-ap-directional-valves', 'Series AP Directional Valves', 'Series AP Directional Valves', 'f3a2776c-6c2e-43c9-9599-9a4b72893b46', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-ap-directional-valves' AND parent_id = 'f3a2776c-6c2e-43c9-9599-9a4b72893b46');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-840-directional-valves', 'Series 840 Directional Valves', 'Series 840 Directional Valves', 'f3a2776c-6c2e-43c9-9599-9a4b72893b46', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-840-directional-valves' AND parent_id = 'f3a2776c-6c2e-43c9-9599-9a4b72893b46');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-563-565-567-directional-valves', 'Series 563/565/567 Directional Valves', 'Series 563/565/567 Directional Valves', 'f3a2776c-6c2e-43c9-9599-9a4b72893b46', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-563-565-567-directional-valves' AND parent_id = 'f3a2776c-6c2e-43c9-9599-9a4b72893b46');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-cl03-ev-directional-valves', 'Series CL03 EV Directional Valves', 'Series CL03 EV Directional Valves', 'f3a2776c-6c2e-43c9-9599-9a4b72893b46', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-cl03-ev-directional-valves' AND parent_id = 'f3a2776c-6c2e-43c9-9599-9a4b72893b46');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-sv09-directional-valves', 'Series SV09 Directional Valves', 'Series SV09 Directional Valves', 'f3a2776c-6c2e-43c9-9599-9a4b72893b46', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-sv09-directional-valves' AND parent_id = 'f3a2776c-6c2e-43c9-9599-9a4b72893b46');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-sv07-directional-valves', 'Series SV07 Directional Valves', 'Series SV07 Directional Valves', 'f3a2776c-6c2e-43c9-9599-9a4b72893b46', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-sv07-directional-valves' AND parent_id = 'f3a2776c-6c2e-43c9-9599-9a4b72893b46');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-490-directional-valves', 'Series 490 Directional Valves', 'Series 490 Directional Valves', 'f3a2776c-6c2e-43c9-9599-9a4b72893b46', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-490-directional-valves' AND parent_id = 'f3a2776c-6c2e-43c9-9599-9a4b72893b46');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-cd02-al-standardized-valve-systems-iso-15407-1', 'Series CD02-AL Standardized Valve Systems ISO 15407-1', 'Series CD02-AL Standardized Valve Systems ISO 15407-1', '42d5db30-8997-4e31-b61a-2671e86126b8', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-cd02-al-standardized-valve-systems-iso-15407-1' AND parent_id = '42d5db30-8997-4e31-b61a-2671e86126b8');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-881-supply-rail-for-series-551-553-valves', 'Series 881 Supply Rail For Series 551/553 Valves', 'Series 881 Supply Rail For Series 551/553 Valves', '42d5db30-8997-4e31-b61a-2671e86126b8', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-881-supply-rail-for-series-551-553-valves' AND parent_id = '42d5db30-8997-4e31-b61a-2671e86126b8');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-e12-e23-e34-air-operated-spool-valves-iso-size-123', 'Series E12/E23/E34 Air Operated Spool Valves ISO Size 1/2/3', 'Series E12/E23/E34 Air Operated Spool Valves ISO Size 1/2/3', '42d5db30-8997-4e31-b61a-2671e86126b8', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-e12-e23-e34-air-operated-spool-valves-iso-size-123' AND parent_id = '42d5db30-8997-4e31-b61a-2671e86126b8');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-cl18-steel-spool-sleeve-valves-air-operated-iso-size-2', 'Series CL18 Steel Spool Sleeve Valves Air Operated ISO Size 2', 'Series CL18 Steel Spool Sleeve Valves Air Operated ISO Size 2', '42d5db30-8997-4e31-b61a-2671e86126b8', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-cl18-steel-spool-sleeve-valves-air-operated-iso-size-2' AND parent_id = '42d5db30-8997-4e31-b61a-2671e86126b8');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-cl26-steel-spool-sleeve-valves-air-operated-iso-size-1', 'Series CL26 Steel Spool Sleeve Valves Air Operated ISO Size 1', 'Series CL26 Steel Spool Sleeve Valves Air Operated ISO Size 1', '42d5db30-8997-4e31-b61a-2671e86126b8', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-cl26-steel-spool-sleeve-valves-air-operated-iso-size-1' AND parent_id = '42d5db30-8997-4e31-b61a-2671e86126b8');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-co1-coils', 'Series CO1 Coils', 'Series CO1 Coils', '0c2a93f1-6fe7-456a-bb7e-4c0fb28f67d3', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-co1-coils' AND parent_id = '0c2a93f1-6fe7-456a-bb7e-4c0fb28f67d3');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-cc02-check-choke-valves', 'Series CC02 Check Choke Valves', 'Series CC02 Check Choke Valves', 'c2902381-ae2e-4bf2-a922-03f83aad3e76', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-cc02-check-choke-valves' AND parent_id = 'c2902381-ae2e-4bf2-a922-03f83aad3e76');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-qr1-check-choke-valves', 'Series QR1 Check Choke Valves', 'Series QR1 Check Choke Valves', 'c2902381-ae2e-4bf2-a922-03f83aad3e76', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-qr1-check-choke-valves' AND parent_id = 'c2902381-ae2e-4bf2-a922-03f83aad3e76');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-ncppg-ncpgg-pilot-operated-check-valves', 'Series NCPPG/NCPGG Pilot Operated Check Valves', 'Series NCPPG/NCPGG Pilot Operated Check Valves', 'c2902381-ae2e-4bf2-a922-03f83aad3e76', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-ncppg-ncpgg-pilot-operated-check-valves' AND parent_id = 'c2902381-ae2e-4bf2-a922-03f83aad3e76');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-nr01-non-return-valves', 'Series NR01 Non-Return Valves', 'Series NR01 Non-Return Valves', 'c2902381-ae2e-4bf2-a922-03f83aad3e76', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-nr01-non-return-valves' AND parent_id = 'c2902381-ae2e-4bf2-a922-03f83aad3e76');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-nr02-non-return-valves', 'Series NR02 Non-Return Valves', 'Series NR02 Non-Return Valves', 'c2902381-ae2e-4bf2-a922-03f83aad3e76', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-nr02-non-return-valves' AND parent_id = 'c2902381-ae2e-4bf2-a922-03f83aad3e76');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'logic-valves', 'Logic Valves', 'Logic Valves', 'c2902381-ae2e-4bf2-a922-03f83aad3e76', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'logic-valves' AND parent_id = 'c2902381-ae2e-4bf2-a922-03f83aad3e76');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-rv1-safety-valves', 'Series RV1 Safety Valves', 'Series RV1 Safety Valves', 'f6c9d86f-bfd2-49ee-9fa9-c639e792bce9', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-rv1-safety-valves' AND parent_id = 'f6c9d86f-bfd2-49ee-9fa9-c639e792bce9');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-sc01-stop-valves', 'Series SC01 Stop Valves', 'Series SC01 Stop Valves', 'c2902381-ae2e-4bf2-a922-03f83aad3e76', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-sc01-stop-valves' AND parent_id = 'c2902381-ae2e-4bf2-a922-03f83aad3e76');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-sev-quick-exhaust-valves', 'Series SEV Quick Exhaust Valves', 'Series SEV Quick Exhaust Valves', '596d61c6-2844-4ca6-9b7a-75e51c49bbcf', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-sev-quick-exhaust-valves' AND parent_id = '596d61c6-2844-4ca6-9b7a-75e51c49bbcf');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-573-quick-exhaust-valves', 'Series 573 Quick Exhaust Valves', 'Series 573 Quick Exhaust Valves', '596d61c6-2844-4ca6-9b7a-75e51c49bbcf', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-573-quick-exhaust-valves' AND parent_id = '596d61c6-2844-4ca6-9b7a-75e51c49bbcf');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-551-hand-or-foot-valves', 'Series 551 Hand Or Foot Valves', 'Series 551 Hand Or Foot Valves', 'f499d631-1c30-4a27-bbba-c3b231209b98', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-551-hand-or-foot-valves' AND parent_id = 'f499d631-1c30-4a27-bbba-c3b231209b98');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-551-552-hand-or-foot-valves', 'Series 551/552 Hand Or Foot Valves', 'Series 551/552 Hand Or Foot Valves', 'f499d631-1c30-4a27-bbba-c3b231209b98', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-551-552-hand-or-foot-valves' AND parent_id = 'f499d631-1c30-4a27-bbba-c3b231209b98');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-551-552-lever-valves', 'Series 551/552 Lever Valves', 'Series 551/552 Lever Valves', 'f499d631-1c30-4a27-bbba-c3b231209b98', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-551-552-lever-valves' AND parent_id = 'f499d631-1c30-4a27-bbba-c3b231209b98');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-437-cnomo-cylinders-type-pcn', 'Series 437 CNOMO Cylinders Type PCN', 'Series 437 CNOMO Cylinders Type PCN', 'a18ec33b-83da-43a7-b63e-dda7aa053955', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-437-cnomo-cylinders-type-pcn' AND parent_id = 'a18ec33b-83da-43a7-b63e-dda7aa053955');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-102-diaphragm-type-cylinder', 'Series 102 Diaphragm Type Cylinder', 'Series 102 Diaphragm Type Cylinder', '023d242d-c055-46bd-8d08-ac8ac9f270e1', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-102-diaphragm-type-cylinder' AND parent_id = '023d242d-c055-46bd-8d08-ac8ac9f270e1');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-msn-guide-cylinders', 'Series MSN Guide Cylinders', 'Series MSN Guide Cylinders', 'a729421c-d7ef-4463-a5f9-d3e2841948a9', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-msn-guide-cylinders' AND parent_id = 'a729421c-d7ef-4463-a5f9-d3e2841948a9');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-twc-double-piston-cylinders', 'Series TWC Double Piston Cylinders', 'Series TWC Double Piston Cylinders', '39a71e92-64a0-477b-80ac-170d062a405f', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-twc-double-piston-cylinders' AND parent_id = '39a71e92-64a0-477b-80ac-170d062a405f');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-gpc-guide-cylinders', 'Series GPC Guide Cylinders', 'Series GPC Guide Cylinders', 'a729421c-d7ef-4463-a5f9-d3e2841948a9', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-gpc-guide-cylinders' AND parent_id = 'a729421c-d7ef-4463-a5f9-d3e2841948a9');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-pra-pneumatic-cylinders-iso-15552', 'Series PRA Pneumatic Cylinders ISO 15552', 'Series PRA Pneumatic Cylinders ISO 15552', 'a18ec33b-83da-43a7-b63e-dda7aa053955', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-pra-pneumatic-cylinders-iso-15552' AND parent_id = 'a18ec33b-83da-43a7-b63e-dda7aa053955');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-gsu-guided-slide-units', 'Series GSU Guided Slide Units', 'Series GSU Guided Slide Units', 'a729421c-d7ef-4463-a5f9-d3e2841948a9', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-gsu-guided-slide-units' AND parent_id = 'a729421c-d7ef-4463-a5f9-d3e2841948a9');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-msc-guide-cylinders', 'Series MSC Guide Cylinders', 'Series MSC Guide Cylinders', 'a729421c-d7ef-4463-a5f9-d3e2841948a9', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-msc-guide-cylinders' AND parent_id = 'a729421c-d7ef-4463-a5f9-d3e2841948a9');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-441-short-stroke-cylinders-type-g441', 'Series 441 Short Stroke Cylinders Type G441', 'Series 441 Short Stroke Cylinders Type G441', '302d1dc2-4a64-463b-b4a1-2ee27cfce6b1', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-441-short-stroke-cylinders-type-g441' AND parent_id = '302d1dc2-4a64-463b-b4a1-2ee27cfce6b1');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-rpc-round-cylinders', 'Series RPC Round Cylinders', 'Series RPC Round Cylinders', 'ec1d0770-3503-4584-a604-e3255c52a97e', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-rpc-round-cylinders' AND parent_id = 'ec1d0770-3503-4584-a604-e3255c52a97e');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-bcp-bellows-actuators', 'Series BCP Bellows Actuators', 'Series BCP Bellows Actuators', 'b4cb85ec-46e2-4eff-ab54-05e1464c98b6', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-bcp-bellows-actuators' AND parent_id = 'b4cb85ec-46e2-4eff-ab54-05e1464c98b6');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-ckp-rodless-cylinders', 'Series CKP Rodless Cylinders', 'Series CKP Rodless Cylinders', '4ba236c9-9c3d-4806-8c32-bc9a72cc51fa', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-ckp-rodless-cylinders' AND parent_id = '4ba236c9-9c3d-4806-8c32-bc9a72cc51fa');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-bcr-bellows-actuators', 'Series BCR Bellows Actuators', 'Series BCR Bellows Actuators', 'b4cb85ec-46e2-4eff-ab54-05e1464c98b6', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-bcr-bellows-actuators' AND parent_id = 'b4cb85ec-46e2-4eff-ab54-05e1464c98b6');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-mni-mini-cylinders-iso-6432', 'Series MNI Mini Cylinders ISO 6432', 'Series MNI Mini Cylinders ISO 6432', '302d1dc2-4a64-463b-b4a1-2ee27cfce6b1', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-mni-mini-cylinders-iso-6432' AND parent_id = '302d1dc2-4a64-463b-b4a1-2ee27cfce6b1');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-icm-mini-cylinders', 'Series ICM Mini Cylinders', 'Series ICM Mini Cylinders', '302d1dc2-4a64-463b-b4a1-2ee27cfce6b1', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-icm-mini-cylinders' AND parent_id = '302d1dc2-4a64-463b-b4a1-2ee27cfce6b1');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-swn-screw-in-cylinders', 'Series SWN Screw-In Cylinders', 'Series SWN Screw-In Cylinders', '302d1dc2-4a64-463b-b4a1-2ee27cfce6b1', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-swn-screw-in-cylinders' AND parent_id = '302d1dc2-4a64-463b-b4a1-2ee27cfce6b1');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-csl-rd-stainless-steel-round-cylinders-iso-6432', 'Series CSL-RD Stainless Steel Round Cylinders ISO 6432', 'Series CSL-RD Stainless Steel Round Cylinders ISO 6432', 'ec1d0770-3503-4584-a604-e3255c52a97e', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-csl-rd-stainless-steel-round-cylinders-iso-6432' AND parent_id = 'ec1d0770-3503-4584-a604-e3255c52a97e');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-rtc-rodless-cylinders', 'Series RTC Rodless Cylinders', 'Series RTC Rodless Cylinders', '4ba236c9-9c3d-4806-8c32-bc9a72cc51fa', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-rtc-rodless-cylinders' AND parent_id = '4ba236c9-9c3d-4806-8c32-bc9a72cc51fa');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-brb-bellows-actuators', 'Series BRB Bellows Actuators', 'Series BRB Bellows Actuators', 'b4cb85ec-46e2-4eff-ab54-05e1464c98b6', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-brb-bellows-actuators' AND parent_id = 'b4cb85ec-46e2-4eff-ab54-05e1464c98b6');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-bcc-bellows-actuators', 'Series BCC Bellows Actuators', 'Series BCC Bellows Actuators', 'b4cb85ec-46e2-4eff-ab54-05e1464c98b6', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-bcc-bellows-actuators' AND parent_id = 'b4cb85ec-46e2-4eff-ab54-05e1464c98b6');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-448-rodless-cylinders', 'Series 448 Rodless Cylinders', 'Series 448 Rodless Cylinders', '4ba236c9-9c3d-4806-8c32-bc9a72cc51fa', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-448-rodless-cylinders' AND parent_id = '4ba236c9-9c3d-4806-8c32-bc9a72cc51fa');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-431-anti-corrosive-cylinders', 'Series 431 Anti-Corrosive Cylinders', 'Series 431 Anti-Corrosive Cylinders', 'a18ec33b-83da-43a7-b63e-dda7aa053955', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-431-anti-corrosive-cylinders' AND parent_id = 'a18ec33b-83da-43a7-b63e-dda7aa053955');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-cci-compact-cylinders', 'Series CCI Compact Cylinders', 'Series CCI Compact Cylinders', '302d1dc2-4a64-463b-b4a1-2ee27cfce6b1', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-cci-compact-cylinders' AND parent_id = '302d1dc2-4a64-463b-b4a1-2ee27cfce6b1');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-khz-short-stroke-cylinders', 'Series KHZ Short Stroke Cylinders', 'Series KHZ Short Stroke Cylinders', '302d1dc2-4a64-463b-b4a1-2ee27cfce6b1', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-khz-short-stroke-cylinders' AND parent_id = '302d1dc2-4a64-463b-b4a1-2ee27cfce6b1');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-ssi-short-stroke-cylinders-iso-15524', 'Series SSI Short Stroke Cylinders ISO 15524', 'Series SSI Short Stroke Cylinders ISO 15524', '302d1dc2-4a64-463b-b4a1-2ee27cfce6b1', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-ssi-short-stroke-cylinders-iso-15524' AND parent_id = '302d1dc2-4a64-463b-b4a1-2ee27cfce6b1');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-ccl-ic-standard-cylinders-iso-21287', 'Series CCL-IC Standard Cylinders ISO 21287', 'Series CCL-IC Standard Cylinders ISO 21287', 'a18ec33b-83da-43a7-b63e-dda7aa053955', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-ccl-ic-standard-cylinders-iso-21287' AND parent_id = 'a18ec33b-83da-43a7-b63e-dda7aa053955');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-kpz-compact-cylinders', 'Series KPZ Compact Cylinders', 'Series KPZ Compact Cylinders', '302d1dc2-4a64-463b-b4a1-2ee27cfce6b1', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-kpz-compact-cylinders' AND parent_id = '302d1dc2-4a64-463b-b4a1-2ee27cfce6b1');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-450-tie-rod-cylinders-type-pes', 'Series 450 Tie Rod Cylinders Type PES', 'Series 450 Tie Rod Cylinders Type PES', 'a18ec33b-83da-43a7-b63e-dda7aa053955', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-450-tie-rod-cylinders-type-pes' AND parent_id = 'a18ec33b-83da-43a7-b63e-dda7aa053955');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-463-cylinders-with-rod-locking-device', 'Series 463 Cylinders With Rod Locking Device', 'Series 463 Cylinders With Rod Locking Device', 'a18ec33b-83da-43a7-b63e-dda7aa053955', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-463-cylinders-with-rod-locking-device' AND parent_id = 'a18ec33b-83da-43a7-b63e-dda7aa053955');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-436-heavy-duty-cylinders-type-pis', 'Series 436 Heavy Duty Cylinders Type PIS', 'Series 436 Heavy Duty Cylinders Type PIS', 'a18ec33b-83da-43a7-b63e-dda7aa053955', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-436-heavy-duty-cylinders-type-pis' AND parent_id = 'a18ec33b-83da-43a7-b63e-dda7aa053955');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-rdc-diaphragm-and-piston-actuators', 'Series RDC Diaphragm And Piston Actuators', 'Series RDC Diaphragm And Piston Actuators', '023d242d-c055-46bd-8d08-ac8ac9f270e1', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-rdc-diaphragm-and-piston-actuators' AND parent_id = '023d242d-c055-46bd-8d08-ac8ac9f270e1');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-trb-tie-rod-cylinders-iso-15552', 'Series TRB Tie Rod Cylinders ISO 15552', 'Series TRB Tie Rod Cylinders ISO 15552', 'a18ec33b-83da-43a7-b63e-dda7aa053955', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-trb-tie-rod-cylinders-iso-15552' AND parent_id = 'a18ec33b-83da-43a7-b63e-dda7aa053955');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-167-tie-rod-cylinder', 'Series 167 Tie Rod Cylinder', 'Series 167 Tie Rod Cylinder', 'a18ec33b-83da-43a7-b63e-dda7aa053955', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-167-tie-rod-cylinder' AND parent_id = 'a18ec33b-83da-43a7-b63e-dda7aa053955');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-ccl-is-standard-cylinders-iso-15552', 'Series CCL-IS Standard Cylinders ISO 15552', 'Series CCL-IS Standard Cylinders ISO 15552', 'a18ec33b-83da-43a7-b63e-dda7aa053955', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-ccl-is-standard-cylinders-iso-15552' AND parent_id = 'a18ec33b-83da-43a7-b63e-dda7aa053955');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-its-tie-rod-cylinders-iso-15552', 'Series ITS Tie Rod Cylinders ISO 15552', 'Series ITS Tie Rod Cylinders ISO 15552', 'a18ec33b-83da-43a7-b63e-dda7aa053955', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-its-tie-rod-cylinders-iso-15552' AND parent_id = 'a18ec33b-83da-43a7-b63e-dda7aa053955');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'vacuum-accessories', 'Vacuum Accessories', 'Vacuum Accessories', 'e1377269-9e88-4335-92cf-b0a22d0d0df6', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'vacuum-accessories' AND parent_id = 'e1377269-9e88-4335-92cf-b0a22d0d0df6');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-sn2-magnetic-proximity-sensors', 'Series SN2 Magnetic Proximity Sensors', 'Series SN2 Magnetic Proximity Sensors', '355fb1d7-b62c-4211-9b71-6f7bd07c0b0a', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-sn2-magnetic-proximity-sensors' AND parent_id = '355fb1d7-b62c-4211-9b71-6f7bd07c0b0a');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-sc4-magnetic-proximity-sensors', 'Series SC4 Magnetic Proximity Sensors', 'Series SC4 Magnetic Proximity Sensors', '355fb1d7-b62c-4211-9b71-6f7bd07c0b0a', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-sc4-magnetic-proximity-sensors' AND parent_id = '355fb1d7-b62c-4211-9b71-6f7bd07c0b0a');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-sn6-magnetic-proximity-sensors', 'Series SN6 Magnetic Proximity Sensors', 'Series SN6 Magnetic Proximity Sensors', '355fb1d7-b62c-4211-9b71-6f7bd07c0b0a', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-sn6-magnetic-proximity-sensors' AND parent_id = '355fb1d7-b62c-4211-9b71-6f7bd07c0b0a');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-st9-magnetic-proximity-sensors', 'Series ST9 Magnetic Proximity Sensors', 'Series ST9 Magnetic Proximity Sensors', '355fb1d7-b62c-4211-9b71-6f7bd07c0b0a', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-st9-magnetic-proximity-sensors' AND parent_id = '355fb1d7-b62c-4211-9b71-6f7bd07c0b0a');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-st4-magnetic-proximity-sensors', 'Series ST4 Magnetic Proximity Sensors', 'Series ST4 Magnetic Proximity Sensors', '355fb1d7-b62c-4211-9b71-6f7bd07c0b0a', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-st4-magnetic-proximity-sensors' AND parent_id = '355fb1d7-b62c-4211-9b71-6f7bd07c0b0a');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-pm1-pressure-switches', 'Series PM1 Pressure Switches', 'Series PM1 Pressure Switches', '7b063f14-1caf-410c-b9ac-147a5609b3c2', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-pm1-pressure-switches' AND parent_id = '7b063f14-1caf-410c-b9ac-147a5609b3c2');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-349-pressure-switches', 'Series 349 Pressure Switches', 'Series 349 Pressure Switches', '7b063f14-1caf-410c-b9ac-147a5609b3c2', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-349-pressure-switches' AND parent_id = '7b063f14-1caf-410c-b9ac-147a5609b3c2');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-pe5-pressure-sensors', 'Series PE5 Pressure Sensors', 'Series PE5 Pressure Sensors', '7b063f14-1caf-410c-b9ac-147a5609b3c2', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-pe5-pressure-sensors' AND parent_id = '7b063f14-1caf-410c-b9ac-147a5609b3c2');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-pe6-pressure-sensors', 'Series PE6 Pressure Sensors', 'Series PE6 Pressure Sensors', '7b063f14-1caf-410c-b9ac-147a5609b3c2', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-pe6-pressure-sensors' AND parent_id = '7b063f14-1caf-410c-b9ac-147a5609b3c2');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-pe2-pressure-sensors', 'Series PE2 Pressure Sensors', 'Series PE2 Pressure Sensors', '7b063f14-1caf-410c-b9ac-147a5609b3c2', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-pe2-pressure-sensors' AND parent_id = '7b063f14-1caf-410c-b9ac-147a5609b3c2');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-ps3-pressure-switches', 'Series PS3 Pressure Switches', 'Series PS3 Pressure Switches', '7b063f14-1caf-410c-b9ac-147a5609b3c2', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-ps3-pressure-switches' AND parent_id = '7b063f14-1caf-410c-b9ac-147a5609b3c2');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-cms-field-bus-modules', 'Series CMS Field Bus Modules', 'Series CMS Field Bus Modules', '355fb1d7-b62c-4211-9b71-6f7bd07c0b0a', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-cms-field-bus-modules' AND parent_id = '355fb1d7-b62c-4211-9b71-6f7bd07c0b0a');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-af1-air-flow-sensor', 'Series AF1 Air Flow Sensor', 'Series AF1 Air Flow Sensor', '87ad5191-aab8-431e-ad26-9e109ee5621e', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-af1-air-flow-sensor' AND parent_id = '87ad5191-aab8-431e-ad26-9e109ee5621e');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'clevis-mountings', 'Clevis Mountings', 'Clevis Mountings', '17646a4e-ffd7-47ae-ae32-65d69b5462e2', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'clevis-mountings' AND parent_id = '17646a4e-ffd7-47ae-ae32-65d69b5462e2');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'rear-eyes', 'Rear Eyes', 'Rear Eyes', '17646a4e-ffd7-47ae-ae32-65d69b5462e2', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'rear-eyes' AND parent_id = '17646a4e-ffd7-47ae-ae32-65d69b5462e2');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'sensor-mountings', 'Sensor Mountings', 'Sensor Mountings', '17646a4e-ffd7-47ae-ae32-65d69b5462e2', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'sensor-mountings' AND parent_id = '17646a4e-ffd7-47ae-ae32-65d69b5462e2');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'gauges', 'Gauges', 'Gauges', '35907cf9-a359-4b6d-a4d8-1130b8b476eb', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'gauges' AND parent_id = '35907cf9-a359-4b6d-a4d8-1130b8b476eb');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-616-sentronichd-pilot-operated-proportional-control-valve', 'Series 616 SentroniCHD Proportional Control Valve', 'Series 616 SentroniCHD Proportional Control Valve', '9597a7c7-bed1-484a-b48a-846d13c7ee8e', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-616-sentronichd-pilot-operated-proportional-control-valve' AND parent_id = '9597a7c7-bed1-484a-b48a-846d13c7ee8e');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-651-filters-regulators-and-lubricators', 'Series 651 Filters Regulators And Lubricators', 'Series 651 Filters Regulators And Lubricators', '54dece26-d48b-46f5-9dbf-fcc2413878e0', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-651-filters-regulators-and-lubricators' AND parent_id = '54dece26-d48b-46f5-9dbf-fcc2413878e0');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-641-642-643-aluminum-filter-regulators', 'Series 641/642/643 Aluminum Filter Regulators', 'Series 641/642/643 Aluminum Filter Regulators', '54dece26-d48b-46f5-9dbf-fcc2413878e0', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-641-642-643-aluminum-filter-regulators' AND parent_id = '54dece26-d48b-46f5-9dbf-fcc2413878e0');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-645-pressure-regulator-and-filter', 'Series 645 Pressure Regulator And Filter', 'Series 645 Pressure Regulator And Filter', '54dece26-d48b-46f5-9dbf-fcc2413878e0', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-645-pressure-regulator-and-filter' AND parent_id = '54dece26-d48b-46f5-9dbf-fcc2413878e0');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-646-pressure-regulator-and-filter', 'Series 646 Pressure Regulator And Filter', 'Series 646 Pressure Regulator And Filter', '54dece26-d48b-46f5-9dbf-fcc2413878e0', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-646-pressure-regulator-and-filter' AND parent_id = '54dece26-d48b-46f5-9dbf-fcc2413878e0');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-80-pressure-regulators', 'Series 80 Pressure Regulators', 'Series 80 Pressure Regulators', '54dece26-d48b-46f5-9dbf-fcc2413878e0', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-80-pressure-regulators' AND parent_id = '54dece26-d48b-46f5-9dbf-fcc2413878e0');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'modular-scraper-systems-and-front-lube-unit', 'Modular Scraper Systems And Front Lube Unit', 'Modular Scraper Systems And Front Lube Unit', '54dece26-d48b-46f5-9dbf-fcc2413878e0', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'modular-scraper-systems-and-front-lube-unit' AND parent_id = '54dece26-d48b-46f5-9dbf-fcc2413878e0');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-pr2-precision-pressure-regulators', 'Series PR2 Precision Pressure Regulators', 'Series PR2 Precision Pressure Regulators', '54dece26-d48b-46f5-9dbf-fcc2413878e0', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-pr2-precision-pressure-regulators' AND parent_id = '54dece26-d48b-46f5-9dbf-fcc2413878e0');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-ar1-compressed-air-reservoirs', 'Series AR1 Compressed Air Reservoirs', 'Series AR1 Compressed Air Reservoirs', '54dece26-d48b-46f5-9dbf-fcc2413878e0', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-ar1-compressed-air-reservoirs' AND parent_id = '54dece26-d48b-46f5-9dbf-fcc2413878e0');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-291-compressed-natural-gas-valve', 'Series 291 Compressed Natural Gas Valve', 'Series 291 Compressed Natural Gas Valve', '36814ab5-7193-4125-94e4-d0500d67935f', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-291-compressed-natural-gas-valve' AND parent_id = '36814ab5-7193-4125-94e4-d0500d67935f');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'series-292-pilot-operated-dual-flow-aluminium-petrol-vending-valves', 'Series 292 Pilot Operated Dual Flow Petrol Vending Valves', 'Series 292 Pilot Operated Dual Flow Petrol Vending Valves', '36814ab5-7193-4125-94e4-d0500d67935f', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'series-292-pilot-operated-dual-flow-aluminium-petrol-vending-valves' AND parent_id = '36814ab5-7193-4125-94e4-d0500d67935f');

INSERT INTO categories (slug, name_en, name_it, parent_id, is_active)
SELECT 'fittings', 'Fittings', 'Fittings', 'c2902381-ae2e-4bf2-a922-03f83aad3e76', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'fittings' AND parent_id = 'c2902381-ae2e-4bf2-a922-03f83aad3e76');

-- Now assign products to the new categories using URL slug matching
UPDATE products p SET category_id = c.id
FROM categories c
WHERE p.category_id IS NULL
  AND p.is_active = true
  AND p.status = 'published'
  AND p.source_url LIKE '%valves-direct.com/%'
  AND p.source_url LIKE '%valves-direct.com/' || c.slug || '/%';

-- Handle Parker RS-Online products by name keywords
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'solenoid-valves' LIMIT 1)
WHERE category_id IS NULL AND is_active AND status = 'published'
  AND brand = 'PARKER' AND source_url LIKE '%rs-online%'
  AND (name_en ILIKE '%solenoid%' OR name_en ILIKE '%valve%');

UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'hydraulic-fittings' LIMIT 1)
WHERE category_id IS NULL AND is_active AND status = 'published'
  AND brand = 'PARKER' AND source_url LIKE '%rs-online%'
  AND (name_en ILIKE '%fitting%' OR name_en ILIKE '%hydraulic%' OR name_en ILIKE '%hose%');

UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'pneumatic-valves' LIMIT 1)
WHERE category_id IS NULL AND is_active AND status = 'published'
  AND brand = 'PARKER' AND source_url LIKE '%rs-online%';

-- Final catch-alls for any remaining uncategorized products
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'solenoid-valves' LIMIT 1)
WHERE category_id IS NULL AND is_active AND status = 'published'
  AND name_en ILIKE '%solenoid%';

UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'directional-control-valves' LIMIT 1)
WHERE category_id IS NULL AND is_active AND status = 'published'
  AND name_en ILIKE '%directional%';

UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'pneumatic-cylinders-actuators' LIMIT 1)
WHERE category_id IS NULL AND is_active AND status = 'published'
  AND (name_en ILIKE '%cylinder%' OR name_en ILIKE '%actuator%');

UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'pneumatic-valves' LIMIT 1)
WHERE category_id IS NULL AND is_active AND status = 'published';