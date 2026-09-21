# V165 source-gap audit

Audited the existing harvested CSVs across 17 areas. No source decisions, approvals or identity holds were changed. This is a records audit; the referenced engineering documents have not been independently re-reviewed.

## Results

797 gap records: **759 open**, **38 recorded closed**. Open records comprise 418 missing values, 150 conflicts, 80 identity/naming conflicts, 76 datasheet blanks and 35 decision follow-ups. These are rows, not 759 independent engineering decisions; several repeat a common issue across equipment.

The harvest contains 4,234 property rows and 491 per-area asset rows (including interfaces and repeated cross-area identities), not 491 unique modeled assets.

No duplicate gap IDs, empty closure requirements, unlinked conflict groups, unsigned approved rows or unindexed approved source IDs were found by the checks. All 38 recorded closures have a matching approved property row, reviewer, review date and source ID. This verifies the recorded links, not MoC completion or downstream design closure.

| Area | Open | Recorded closed |
|---|---:|---:|
| A-100 | 22 | 0 |
| A-140 | 45 | 4 |
| A-160 | 28 | 0 |
| A-200 | 116 | 28 |
| A-300 | 59 | 2 |
| A-400 | 45 | 0 |
| A-500 | 21 | 2 |
| A-600 | 21 | 0 |
| A-700 | 71 | 1 |
| A-800 | 36 | 1 |
| A-900 | 21 | 0 |
| A-1000 | 92 | 0 |
| A-2000 | 76 | 0 |
| A-3000 | 43 | 0 |
| A-4000 | 18 | 0 |
| A-5000 | 40 | 0 |
| A-6000 | 5 | 0 |

## Findings and recommended sequence

1. **Reconcile A-900 identities first.** GAP-A-900-017 through 019 document register/model differences. Preserve H-901, SC-901, PK-901 and DC-901 holds until an approved PFD change or model re-tag resolves them. PV-A-900-0206 and 0207 remain held. Then address GAP-A-900-016, 020 and 021: product-rate basis, density definition, potassium/ignition characterization, cooling responsibility and inerting scope. The new operation mapping only fixes software ownership; it grants no engineering approval.
2. **Align the common production basis before sizing.** GAP-A-100-018, A-140-042/043 and A-160-023 require stream-table revisions and count/volume/transfer decisions. The A-140 four-reactor model differs from the recorded 2 + 1 basis. Follow those dependencies before treating downstream rates or utility duties as final.
3. **Resolve thermal and off-gas package boundaries.** A-700 decision D-A700-01 calls for three furnace modules while the model has one; its follow-up remains open after the design-concept approval. A-800 gaps 016–018 retain ratio-document updates, residence/pressure/temperature questions and condenser/off-gas boundary work. Approval of one property does not complete the package.
4. **Close shared service bases.** GAP-A-5000-037 requires the proposed high-temperature loop and demand reconciliation; GAP-A-6000-003/004 retains the argon/nitrogen basis conflict; GAP-A-4000-017 requires a reconciled air-demand schedule. Use the approved revised process basis as input.

These priorities are a proposed review sequence based on dependencies recorded in the harvest, not an engineering risk ranking.

## Stale wording requiring reconciliation

The nine candidates below claim missing records/geometry or describe outdated modeling scope. Existing foundation records make blanket absence claims stale, but specific register equipment can still be absent. Keep the underlying engineering gap open; update wording through the source/reconciliation workflow rather than silently closing the row.

- GAP-A-100-018
- GAP-A-100-021
- GAP-A-140-046
- GAP-A-160-023
- GAP-A-160-026
- GAP-A-900-016
- GAP-A-4000-017
- GAP-A-4000-018
- GAP-A-5000-037

Current foundation evidence: scripts/expand-early-areas-semantic.mjs and the generated A-900, A-4000 and A-5000 foundation records; generated assets in dist/semantic/v1/assets. A-900 register-only equipment remains distinct from the conceptual pelletization geometry.

## Reproduce and trace

Run node scripts/audit-source-gaps.mjs. docs/source-gap-audit.json retains every original gap ID, subject, required source, status and note, plus area counts and check findings. Sources are data/semantic/<area>/source-gaps.csv joined to property-values.csv, documents.csv and identity-holds.csv. The checker does not infer document validity from an index entry, resolve conflicts, verify original source contents or claim complete plant-wide relationship validation.
