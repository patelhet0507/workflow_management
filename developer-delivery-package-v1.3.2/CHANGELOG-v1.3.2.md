# CHANGELOG — v1.3.2 (Final Sign-off Corrections)

**v1.3.2 is the final sign-off correction release.** Every item in "What Must Not Change" from
the v1.3.2 change request — one ACTIVE transaction per unit, unlimited history, Cancellation
preserving history, Unit Change creating a new transaction, Customer Change never creating one,
three independent Management approvals, Direct Sale Deed skipping ATS, Send Back requiring a
remark, no Reject, financial exceptions never blocking workflow, TDS as a non-blocking exception,
physical custody's independence from workflow, server-side identity, immutable audit, Drive
versioning, workflow versioning, delegation, the Legal Manager acting mechanism, the daily
pendency report, the notification architecture, and the permission matrix — is preserved exactly
as it was. Nothing below reverses or redesigns any of it.

---

## 1. Physical Document Must Have an Identity From Creation

**Fix:** `documents.google_drive_file_id` is now nullable (with a `CHECK` constraint requiring it
for every type except the two new physical types). Added `ATS_PRINT` and `SALE_DEED_PRINT` to
`document_type`. Added `documents.physical_document_id` (self-referencing) so a later scan's
digital `documents` row links back to the physical print row it came from, without disturbing the
existing Drive-versioning model for the digital row itself. A `documents` row is now created the
moment Legal Executive completes the print/Garvi stage — before any scan exists — so
`physical_custody_log.document_id` has a real row to reference from that point on. Historical
NULL `document_id` rows from before this correction are explicitly not backfilled, per
instruction. Prototype: `submitStage` now auto-creates a document record at `legal_exec_print`
and a linked scan record at `admin_scan`; `PhysicalCustodyPanel` picks from these real records
(a dropdown) instead of a free-typed label.

Files: `phase1-specification-v1.3.2.md` (§1.4, §1.7), `erd-v1.3.2.mermaid`,
`workflow-saledeed-v1.3.2.mermaid` (print-stage annotation), `App-v1.3.2.jsx`

## 2. Finalize the Unit Status Model

**Fix:** Rewrote §1.3a into a complete, unambiguous table covering every value in the original
spec's enum, including the three that were unclear before:
- `ATS_REGISTERED` / `SALE_DEED_REGISTERED` now correctly mean "registration itself has
  occurred" (a `registration_details` row exists), not "the entire workflow including
  scan/handover is complete" — v1.3.1 had this wrong.
- `COMPLETED` is now precisely defined as Sale Deed `workflow_instance.status = COMPLETED` with
  zero open financial exceptions; `FINANCIAL_EXCEPTION` is the same condition with at least one
  open exception — mutually exclusive, both distinct from the registration-only statuses above.
- `UNIT_CHANGED` (unit-facing) vs. `SUPERSEDED` (transaction-lifecycle-facing) are explicitly
  separated: `UNIT_CHANGED` is what a unit's status shows after its transaction becomes
  `SUPERSEDED` via an approved Unit Change. `SUPERSEDED` itself is documented as *not currently
  produced as a unit status by any business event* — reserved for a possible future unit-master
  event (e.g. renumbering/consolidation), explicitly out of scope here, not invented or guessed
  at as a business rule.

Files: `phase1-specification-v1.3.2.md` (§1.3a)

## 3. Fix Unit Status Recomputation Architecture

**Fix:** Replaced the v1.3.1 "trigger on transactions" description (insufficient — it couldn't
react to `workflow_instances` or `financial_exceptions` changes) with one authoritative function,
`recompute_unit_status(unit_id)`, that owns all derivation logic. New §1.3b documents the six
event types that must invoke it (transaction change, workflow instance change, financial
exception create/resolve, cancellation approval, unit change approval, registration entry) and
the recommended implementation shape (thin triggers on each relevant table that all call the same
one function — never duplicate the derivation logic itself).

Files: `phase1-specification-v1.3.2.md` (§1.3b)

## 4. Make Cancellation Approval Configuration-Driven

**Fix:** Documented (and modeled at the schema level) that Cancellation's approval sequence is
read from the same `workflow_definitions`/`workflow_stage_defs` engine as every other workflow —
via a new `applicable_if_financial_implications` column on `workflow_stage_defs`, exactly
analogous to the existing `applicable_if_direct_sale_deed` column already used to skip ATS for
Direct Sale Deed cases. The Management-only / CFO→Management behavior is unchanged; it's now
explicitly the *default configuration*, not hard-coded API logic. `workflow-cancellation-v1.3.2.mermaid`
updated with the same framing.

Files: `phase1-specification-v1.3.2.md` (§1.9), `workflow-cancellation-v1.3.2.mermaid`

## 5. Financial Exception Independence — Diagram Correction

**Fix:** Rebuilt `workflow-saledeed-v1.3.2.mermaid`'s CFO Receipt Check → Customer Signature
transition around an explicit Mermaid fork (`<<fork>>`) state, so Financial Exception Open reads
as a genuine parallel/independent branch rather than a node sitting inline in the main sequence.
No business rule changed — CFO can still approve with pending receipts, the workflow still always
continues to Customer Signature regardless. Diagram-only correction, as instructed.

Files: `workflow-saledeed-v1.3.2.mermaid`

## 6. Correct Stale ERD Description for Customer Change

**Fix:** The ERD's top-level relationship label for `source_transaction_id` still said "Unit
Change / Customer Change lineage" even after v1.3.1 corrected the attribute-level comment on the
field itself — a real inconsistency within the same file. Now reads "Unit Change lineage only"
in both places, plus a new relationship line for the v1.3.2 `previous_cancelled_transaction_id`
field (item 8), explicitly labeled as a *different* link for a *different* event.

Files: `erd-v1.3.2.mermaid`

## 7. Add Global Search to Phase 2 Wireframes

**Fix:** Added a tenth wireframe screen — one filter bar (Project, Unit, Customer, CRM, Booked
By, Source, Payment Plan, Document Type, SRO, Registration Number, Current Stage, Registration
Date) and one results table that opens the existing Control Sheet. Deliberately thin — reuses the
existing table/filter visual language, does not duplicate the Reports screen (Search finds one
transaction fast; Reports produces a filtered/exportable list).

Files: `phase2-wireframes-v1.3.2.html`

## 8. Cancellation + Rebooking — New Sale Value / Financial Snapshot Independence

**Fix (the substantial new item):** New §1.9c (comparison table distinguishing
Cancellation+Rebooking from Unit Change — different trigger, different lifecycle transitions,
different linking field, different financial treatment) and §1.9d (the financial-snapshot rule
itself) added to the spec. New field `transactions.previous_cancelled_transaction_id` —
deliberately separate from `source_transaction_id` (item 6) so the two event types can never be
conflated by a query joining "transaction lineage." Explicit prohibition stated: no code path may
copy financial fields from a cancelled transaction into a rebooking merely because they share a
unit.

Prototype: `createAllocation` now checks, at creation time, whether the target unit's most recent
transaction is `CANCELLED`; if so it records the link (never touching either transaction's
financial fields) and notifies Management. The existing "cancellation" report (previously listed
but not implemented) is now wired up, showing original transaction/customer/sale value,
cancellation date, new transaction/customer/sale value, and a derived (never-stored) price
difference. A "Rebooking" badge now shows on a transaction's detail header when this link exists.

Files: `phase1-specification-v1.3.2.md` (§1.9c, §1.9d), `erd-v1.3.2.mermaid`, `App-v1.3.2.jsx`,
`README-v1.3.2.md` (acceptance test)

## 9. Clarify App.jsx Prototype Status

**Fix:** Added an explicit, prominent comment block at the top of `App-v1.3.2.jsx` stating it is
a functional UI prototype, not production code, and that the Phase 2 wireframes and Phase 1
specification are authoritative wherever the prototype is simplified. Same statement added to
`README-v1.3.2.md` §1 and §3. No production functionality was added to the prototype as part of
this item — this is documentation only, per the explicit instruction not to expand App.jsx.

Files: `App-v1.3.2.jsx`, `README-v1.3.2.md`

## 10. Consistency Pass

Performed after all corrections above, targeted at the 14 terms/rules listed in the v1.3.2
change request:
- Physical document identity: consistent across §1.4/§1.7 of the spec, the ERD, the Sale Deed
  diagram's print-stage annotation, and the prototype's document-creation logic.
- Unit status derivation (all sub-items: `UNIT_CHANGED` vs `SUPERSEDED`, `ATS_REGISTERED`,
  `SALE_DEED_REGISTERED`, `COMPLETED`): single source of truth in §1.3a, cross-checked against
  the Sale Deed diagram's annotations (item 5's file) which now cite the corrected conditions
  inline rather than repeating an independent (and previously wrong) description.
- Cancellation approval sequence: consistent between §1.9's prose, the
  `applicable_if_financial_implications` schema note, and the Cancellation diagram.
- Financial Exception independence: consistent between §1.5 (unchanged since v1.3), the
  restructured Sale Deed diagram, and §1.3a's `COMPLETED`/`FINANCIAL_EXCEPTION` rows.
- Customer Change vs. Unit Change vs. Cancellation+Rebooking: all three now have explicit,
  mutually-referencing sections (§1.9, §1.9c, §1.9d) and distinct linking fields, grep-verified
  in the prototype (`sourceChangeType` never set to anything but `null`/`'UNIT_CHANGE'`;
  `previousCancelledTransactionId` set only in `createAllocation`, never in `approveUnitChange`).
- Global Search: present in the wireframes only (as scoped — it's a UI-entry-point gap, not a
  schema gap; the API's `GET /transactions?...` already covered the query side since v1.3).
- No part of the package suggests a rebooking inherits or modifies the old transaction's Sale
  Value — grep-verified: the only place `saleDeedValue` is set on a transaction is user input in
  `NewAllocationModal`, and `createAllocation` never reads a prior transaction's financial fields.

No unrelated changes were made during this pass.

---

## Files changed

- `phase1-specification-v1.3.2.md` (from `phase1-specification-v1.3.1.md`)
- `erd-v1.3.2.mermaid` (from `erd-v1.3.1.mermaid`)
- `workflow-cancellation-v1.3.2.mermaid` (from `workflow-cancellation-v1.3.mermaid`)
- `workflow-saledeed-v1.3.2.mermaid` (from `workflow-saledeed-v1.3.mermaid`)
- `phase2-wireframes-v1.3.2.html` (from `phase2-wireframes-v1.3.1.html`)
- `App-v1.3.2.jsx` (from `App-v1.3.1.jsx`)
- `README-v1.3.2.md` (from `README-v1.3.1.md`)
- `CHANGELOG-v1.3.2.md` (new, this file)

## Files unchanged (still current at their existing filenames — not duplicated)

- `original-spec.pdf`
- `workflow-allocation-v1.3.mermaid`, `workflow-ats-v1.3.mermaid`,
  `workflow-direct-saledeed-v1.3.mermaid`, `workflow-customer-change-v1.3.mermaid` — no v1.3.2
  correction applied to any of them
- `workflow-unit-change-v1.3.1.mermaid` — no v1.3.2 correction applied
- `CHANGELOG-v1.3.1.md`, `CHANGELOG-v1.3.md` — historical record of prior passes
- All v1.2 and v1.3 files kept for comparison only

---

## v1.3.2 corrections completed — checklist

- [x] 1. Physical document identity from creation (documents row at print time, nullable Drive ID, physical→digital link)
- [x] 2. Unit status model finalized (all 12 enum values unambiguously defined)
- [x] 3. Unit status recomputation centralized into one authoritative function
- [x] 4. Cancellation approval sequence documented as configuration-driven, same engine as elsewhere
- [x] 5. Financial Exception shown as a parallel state in the Sale Deed diagram, not an inline stage
- [x] 6. Stale ERD "Unit Change / Customer Change" label corrected to "Unit Change lineage only"
- [x] 7. Global Search added to Phase 2 wireframes
- [x] 8. Cancellation + Rebooking financial-snapshot-independence rule specified and implemented, with reporting
- [x] 9. App.jsx prototype status explicitly clarified (documentation only, not expanded)
- [x] 10. Cross-document consistency pass performed against all 14 listed terms/rules
- [x] 11. "What must not change" list preserved in full — verified against every corrected file
- [x] 12. Cancellation+Rebooking vs. Unit Change distinction made explicit everywhere (new §1.9c comparison table, distinct linking fields, distinct unit statuses)

## Open Issues / Decisions Required

*(Empty, as instructed — everything in the v1.3.2 change request has been implemented.)*

The three items carried forward from `CHANGELOG-v1.3.md`/`CHANGELOG-v1.3.1.md` (Booked By
fuzzy-match threshold, whether workflow versioning should ever be per-stage rather than
whole-workflow, and confirmation of the exact rounding/display convention for a rebooking price
difference in real currency formatting) remain implementation-detail decisions for whoever builds
Phase 3 — none of them are architecture questions, none block starting implementation, and none
were in scope for the v1.3.2 change request's 14 items.

**The architecture is FROZEN as of this release.**

---

## Addendum — final sign-off cleanup pass (same v1.3.2 release, no version bump)

Two corrections found and fixed after the initial v1.3.2 pass, both narrow:

**A. Unit status: `AVAILABLE` could be misread as reachable from a completed sale.**
§1.3a's `AVAILABLE` row previously included a parenthetical suggesting a transaction that
"reached `COMPLETED`/terminal state" could also satisfy `AVAILABLE`. That was never actually
reachable given the schema (`transaction_lifecycle_status` only has `ACTIVE`/`CANCELLED`/
`SUPERSEDED` — there is no `COMPLETED` lifecycle value, and completing a sale never changes
`lifecycle_status`), but the wording was genuinely ambiguous and worth eliminating rather than
leaving to a developer's interpretation. Fixed by adding an explicit three-step evaluation order
ahead of the table (ACTIVE transaction's own workflow state takes priority over everything else;
only a unit with *zero* transactions ever can show `AVAILABLE`) and narrowing the `AVAILABLE` row
to match. No schema or business-rule change — `recompute_unit_status(unit_id)` remains the one
authoritative function; this was a documentation-clarity fix only. The prototype (`App-v1.3.2.jsx`)
was checked and doesn't implement a `units.status` display at all (it's transaction-centric, not
unit-centric, in its UI) — so there was nothing to correct there; verified via search, zero
occurrences of `AVAILABLE` in the file.

**B. Stale physical-document ERD wording.** Two lines in `erd-v1.3.2.mermaid` still carried their
original v1.3.1-era "nullable pre-print" labels, left over from before the v1.3.2 print-time
document-identity model was introduced in the same release. Corrected to state plainly that
`physical_custody_log.document_id` is populated from the moment of printing, matching the rest
of the v1.3.2 spec. (The identical old wording still appears in `erd-v1.3.1.mermaid` — that's the
correct, historical v1.3.1 file, intentionally untouched; not a live inconsistency.)

Files touched: `phase1-specification-v1.3.2.md` (§1.3a), `erd-v1.3.2.mermaid`, `README-v1.3.2.md`
(two new acceptance tests). No other file needed a change — `App-v1.3.2.jsx`,
`phase2-wireframes-v1.3.2.html`, `workflow-cancellation-v1.3.2.mermaid`,
`workflow-saledeed-v1.3.2.mermaid`, and the Cancellation+Rebooking / Unit Change architecture
were all checked and found already consistent, so left untouched per instruction.
