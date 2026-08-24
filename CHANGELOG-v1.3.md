# CHANGELOG — v1.3

Item-by-item disposition of the Version 1.3 change request against v1.2. Status legend:

- **Fixed** — real correction made across schema/diagrams/wireframes/prototype as applicable.
- **Documented** — the rule is now written explicitly (was implied or scattered before); no
  structural change was needed because v1.2's architecture already supported it correctly.
- **Partial** — corrected at the schema/architecture level; the interactive prototype
  demonstrates it at a reduced/simplified fidelity (noted per-row). Not a gap in the real spec,
  a scope limit of the browser-prototype layer specifically.
- **Deferred** — genuinely not done; flagged rather than faked. None of the load-bearing
  correctness items are in this state — see the table.

| ID | Change | Status | Reason / detail | Files changed |
|---|---|---|---|---|
| A1 | Table creation order (documents before loan_cheque_details) | **Fixed** | Documents section moved from old §1.7 to new §1.4, ahead of Financials (§1.5). DDL now executes top-to-bottom without reordering. | phase1-specification-v1.3.md |
| A2 | Transaction ↔ Unit: one active, many historical | **Fixed** | `lifecycle_status` enum (ACTIVE/CANCELLED/SUPERSEDED) + partial unique index `WHERE lifecycle_status='ACTIVE'` replaces the bare `UNIQUE` on `unit_id`. Prototype rewritten to key transactions by their own `id`, not by unit — a cancelled unit's old transaction stays fully visible and a new one can be created. | phase1-specification-v1.3.md, erd-v1.3.mermaid, App-v1.3.jsx |
| A3 | Cancellation lifecycle explicit | **Fixed** | Explicit lifecycle text + dedicated `workflow-cancellation-v1.3.mermaid`. Prototype: cancellation approval now sets `lifecycleStatus: 'CANCELLED'` (not a separate boolean), unit becomes selectable again in the New Allocation modal. | phase1-specification-v1.3.md, workflow-cancellation-v1.3.mermaid, App-v1.3.jsx |
| A4 | Unit Change: old preserved, new created, two-way link | **Fixed** | `transactions.source_transaction_id` / `source_change_type` added (in addition to v1.2's already-correct `unit_change_requests.old/new_transaction_id`) for direct bidirectional navigation without a join. Prototype: `approveUnitChange` creates a genuinely new transaction record (`SUPERSEDED` on the old one, `unit_id` on the old one never mutated). | phase1-specification-v1.3.md, workflow-unit-change-v1.3.mermaid, App-v1.3.jsx |
| A5 | Customer Change: history beyond the audit log | **Fixed** | `customer_change_requests` gained `approved_customer_name`/`approved_by`/`approved_at` — the request row itself is now a complete, permanent history entry (not reliant on generic audit log). Prototype: two-step request → Management-approve, full list retained and shown per transaction. | phase1-specification-v1.3.md, workflow-customer-change-v1.3.mermaid, App-v1.3.jsx |
| B6 | Booked By normalization, alias, merge | **Fixed** (prototype: **Partial**) | Schema adds `name_key`, `merged_into_id`, and a `booked_by_aliases` table, plus documented merge behavior (old transactions keep pointing at the merged-away master; reports roll up). Prototype implements duplicate warning on add + a working Merge action (marks inactive, records `mergedIntoId`) but does not implement trigram/fuzzy similarity — it uses the same exact-normalized-key check as unit numbers, which catches whitespace/case/punctuation variants but not genuine misspellings like "Kaurani" vs "Kourani". A real implementation should use `pg_trgm` as noted in the spec. | phase1-specification-v1.3.md, App-v1.3.jsx |
| C7 | Workflow-definition versioning | **Fixed** (prototype: **Partial**) | Schema adds `workflow_definitions` / `workflow_definition_versions` with DRAFT/ACTIVE/RETIRED status and an immutability flip on first use — this is the real, complete model. The prototype does **not** implement the full DRAFT/ACTIVE/RETIRED lifecycle or per-stage editing; it demonstrates the *effect* only — a simple version-number counter per workflow type that Super Admin can "bump," new transactions tag themselves with the current version at creation and keep it forever. Good enough to prove the concept (a transaction's version never changes after creation, even after a bump), not a stand-in for the real versioning UI. | phase1-specification-v1.3.md, erd-v1.3.mermaid, App-v1.3.jsx |
| C8 | Explicit backend transition validation | **Documented** | v1.2's architecture already implied this; v1.3 makes it one explicit, unmissable rule (§1.6b) with the exact rejection list from the change request. No schema change was needed — this was a documentation gap, not an architecture gap. | phase1-specification-v1.3.md |
| C9 | Delegation validation rules | **Fixed** | `CHECK` constraints added (`start_date <= end_date`, no self-delegation) at the DB level. Evaluation-order rule for overlapping delegations (most-recently-created wins, logged) written explicitly. Prototype: the two CHECK-equivalent validations are now enforced client-side in the Setup form (both were previously unvalidated). | phase1-specification-v1.3.md, App-v1.3.jsx |
| D10 | Reports screen in Phase 2 | **Fixed** (prototype: **Partial**) | New wireframe screen showing the full 19-report catalogue and the shared selector→filter→table→export→drill-down shape. Prototype wires up 3 reports to real data (Financial Exception, Legal Manager Acting, Physical Custody) as a representative sample; the other 16 are listed in the selector and explicitly labeled "not wired up" rather than faked with placeholder data. | phase2-wireframes-v1.3.html, App-v1.3.jsx |
| D11 | Financial Management Dashboard | **Fixed** | New wireframe screen + new prototype tab: headline figures, per-component pending-amount table with drill-down, and an explicit note that this view is independent of document/workflow status. | phase2-wireframes-v1.3.html, App-v1.3.jsx |
| D12 | My Tasks missing Date Received | **Fixed** | Column added to the wireframe table. (This was a wireframe-only gap — the underlying `my-tasks` API/report was never missing the concept, just the mockup's column list.) | phase2-wireframes-v1.3.html |
| E13 | Physical custody: operational transfer UI | **Fixed** | Wireframe Control Sheet gained a dedicated custody region with a Transfer action + history table. Prototype: custody is no longer *derived* from workflow stage (a real behavior change, not just cosmetic) — it's a standalone `custodyLog` array per transaction/workflow, updated only by an explicit "Transfer Physical Document" action anyone involved can use, exactly per the correction requested. | phase2-wireframes-v1.3.html, App-v1.3.jsx, phase1-specification-v1.3.md (§1.7) |
| F14 | Formal Remark vs. Internal Comment | **Fixed** | Wireframe Control Sheet shows both side by side, clearly labeled. Prototype: workflow-stage remarks stay attached to their stage (labeled "Formal remark" in the UI); a separate `internalComments` array + panel was added per transaction, with @mention detection that fires a notification but never touches workflow state. | phase2-wireframes-v1.3.html, App-v1.3.jsx |
| G15 | Control Sheet improvements | **Fixed** | Added Identity (with workflow version), Physical Custody, Changes & Exceptions, and Formal/Internal remark regions to the wireframe; kept it read-oriented as instructed — the only two truly new *actions* on the page (custody transfer, posting a comment) are both explicitly non-workflow-moving. | phase2-wireframes-v1.3.html |
| H16 | App.jsx corrected end to end | **Fixed** (see per-sub-item rows A2–A5, C7, E13, F14, D10, D11 above) | Full rewrite (`App-v1.3.jsx`, 1,404 lines vs. v1.2's 1,075) covering every sub-item (A) through (I) from the change request except the two explicitly flagged as Partial above. | App-v1.3.jsx |
| I17 | Direct Sale Deed preserved | **Preserved, unchanged** | No correction requested or needed; carried forward exactly. | workflow-direct-saledeed-v1.3.mermaid, App-v1.3.jsx |
| J18 | Document versioning preserved | **Preserved, unchanged** | Already correct in v1.2. | phase1-specification-v1.3.md |
| J19 | Document-type validation at a stage | **Documented** | Mechanism (`required_documents` JSONB on stage defs, checked by the same §1.6b rule engine) made explicit; this was implied but not spelled out in v1.2. | phase1-specification-v1.3.md |
| K20 | Notification architecture preserved | **Fixed (extended)** | Preserved, plus two events added that v1.3's other changes introduced the need for: "Delegation ended" (fires from the daily job) and "Booked By master merge" confirmation. | phase1-specification-v1.3.md |
| L21 | Audit requirements explicit | **Fixed** | Explicit "no client-trusted identity" section added; DB-role GRANT restriction (INSERT+SELECT only on `audit_log`) called out as an implementation requirement, not just a comment. | phase1-specification-v1.3.md |
| M | Mermaid diagrams updated | **Fixed** | `erd-v1.3.mermaid` updated with all new entities/relationships. Three new dedicated diagrams created: `workflow-cancellation-v1.3.mermaid`, `workflow-unit-change-v1.3.mermaid`, `workflow-customer-change-v1.3.mermaid`. The four workflow diagrams with no required change (Allocation, ATS, Sale Deed, Direct Sale Deed) were carried forward under `-v1.3` filenames with a one-line provenance note rather than silently left un-versioned — per "preserve what's correct," their content is unchanged from v1.2. | erd-v1.3.mermaid + 7 workflow-*-v1.3.mermaid files |
| N22 | Acceptance tests expanded | **Fixed** | New test cases (unit reuse, unit change, customer change, Booked By duplicate/merge, workflow version, delegation edge cases, physical custody independence, TDS exception, audit-on-every-mutation) added to the acceptance checklist. | README-v1.3.md |
| O23 | README status language corrected | **Fixed** | See README-v1.3.md — status language no longer claims "Done" anywhere in the package. | README-v1.3.md |

## Ambiguities flagged (not resolved by invented rules, per instruction)

- **Booked By merge fuzzy-matching threshold.** The change request asks for a duplicate warning
  but doesn't specify a similarity threshold. v1.3's schema names `pg_trgm` as the mechanism but
  does not set a cutoff — that's a tuning decision for whoever implements it against real data,
  not something to guess at here.
- **Unit Change financial carry-forward.** When Unit Change creates a new transaction, v1.3 has
  it copy the old transaction's financial baseline as an unlocked starting point. The original
  spec doesn't say whether the new unit's price should differ from the old one's (units in
  different buildings/floors plausibly have different Sale Deed values) — copying-then-editing
  seemed like the safer default over inventing a repricing rule, but this should be confirmed
  with the business owner before Phase 3 implementation, not assumed correct.
- **Workflow version and in-flight ATS/Sale Deed stage defs.** v1.3's schema versions the whole
  workflow (all stages as one unit) rather than allowing individual stages to be versioned
  independently. The change request's examples ("Sale Deed Workflow V1 / V2") are consistent
  with whole-workflow versioning, so that's what was built — but if the real intent was
  finer-grained per-stage versioning, that's a different (more complex) model and should be
  confirmed.
