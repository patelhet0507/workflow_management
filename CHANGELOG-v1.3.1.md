# CHANGELOG — v1.3.1

**v1.3.1 is a surgical correction release, not a redesign.** Every v1.3 architecture decision
listed as "approved and must not be redesigned" in the change request (transaction history,
Cancellation, Unit Change, Customer Change, workflow versioning, physical custody independence,
financial exceptions, Direct Sale Deed, Formal Remark vs. Internal Comment, append-only audit,
No Reject) is preserved exactly as it was in v1.3. Nothing in this release reverses or redesigns
any of that. Everything below is a narrow, specific fix.

---

## 1. Physical Custody Document Identity

**Problem:** `physical_custody_log` recorded who had a transaction's physical document, but not
*which* document — insufficient once a transaction can have several documents in flight at once
(ATS print, Sale Deed print, receiving copy).

**Fix:** Added `document_id UUID REFERENCES documents(id)` to `physical_custody_log` (nullable,
since a transfer can be logged before a `documents` row exists for something not yet
scanned/uploaded). `workflow_type` is kept as a classification alongside it, not removed.
"Current holder" queries are now scoped per document. API's custody-transfer endpoint accepts
`documentId`. Wireframe custody table gained a Document column. Prototype's custody log is now
keyed per document label, with the transfer form asking which document moved and the display
showing a separate current-holder badge per document.

Files: `phase1-specification-v1.3.1.md` (§1.7, §3 API), `erd-v1.3.1.mermaid`,
`phase2-wireframes-v1.3.1.html`, `App-v1.3.1.jsx`

## 2. Change Request Requester / Formal Remark

**Problem:** `unit_change_requests` and `customer_change_requests` didn't explicitly record who
raised the request as their own field (relying on the general audit log instead).

**Fix:** Added `requested_by UUID NOT NULL REFERENCES users(id)` to both tables
(`cancellations` already had it). On the "formal remark" question: all three tables already had
a mandatory `reason TEXT NOT NULL` field that functions exactly as the requested `request_remark`
— permanent, mandatory, structurally separate from `internal_comments`. Rather than add a second,
redundant free-text column, the existing `reason` field is now explicitly documented as fulfilling
that role. Internal comments remain untouched as operational-only communication. Prototype's
`requestUnitChange`/`requestCustomerChange` now store `requestedBy`; the UI displays it next to
the existing reason text on all three request types.

Files: `phase1-specification-v1.3.1.md` (§1.9), `erd-v1.3.1.mermaid`,
`phase2-wireframes-v1.3.1.html`, `App-v1.3.1.jsx`

## 3. Customer Change Transaction Lineage Clarification

**Problem:** `transactions.source_change_type` listed `'CUSTOMER_CHANGE'` as a possible value,
implying Customer Change could create a new transaction the way Unit Change does. It never
actually did (v1.3's own `approveCustomerChange` never created a new transaction) — this was a
documentation inconsistency, not a behavioral bug.

**Fix:** `source_change_type` is now documented as `NULL | 'UNIT_CHANGE'` only. Customer Change
continues to work exactly as it did in v1.3: same transaction, `customer_name` updated,
permanent history via `customer_change_requests`. No code or schema behavior changed — only the
field's documented range of values, which was wrong.

Files: `phase1-specification-v1.3.1.md` (§1.3, §1.9), `erd-v1.3.1.mermaid`

## 4. Workflow Version Database Constraints

**Fix (4A):** Added a partial unique index —
`CREATE UNIQUE INDEX ... ON workflow_definition_versions (workflow_definition_id) WHERE status = 'ACTIVE'`
— so only one ACTIVE version can exist per workflow definition, enforced by Postgres, not just
by the activation sequence in application code. The existing "retire the old version, then
activate the new one" logic is preserved as the normal path; this index is the backstop.

**Fix (4B):** Added `UNIQUE (workflow_definition_version_id, stage_key)` to
`workflow_stage_defs`, alongside the existing `(workflow_definition_version_id, stage_order)`
constraint — `stage_key` is referenced by `send_back_target_stage` and needs to be a reliable,
unique lookup target.

Files: `phase1-specification-v1.3.1.md` (§1.6)

## 5. Unit Change Availability Validation

**Fix:** Documented and (in the prototype) implemented explicit business validation on Unit
Change approval, run *before* attempting the transaction transition: old transaction still
ACTIVE, request still PENDING, new unit still exists, new unit has no ACTIVE transaction, new
unit's derived status is consistent with available. The transition itself remains atomic. If the
new unit became unavailable between request and approval, the approval is rejected with a clear
business error rather than surfacing a raw database constraint failure. The partial unique index
from v1.3 remains the final concurrency safety net — this validation is a pre-check for a good
error message, not a replacement for it.

Files: `phase1-specification-v1.3.1.md` (§1.9), `workflow-unit-change-v1.3.1.mermaid`,
`App-v1.3.1.jsx` (`approveUnitChange` now returns a clear alert instead of proceeding blindly)

## 6. Unit Change Historical Preservation Wording

**Problem:** Phrases like "old transaction stays intact and untouched" were technically
inaccurate — the old transaction's `lifecycle_status` does change, ACTIVE → SUPERSEDED.

**Fix:** Replaced throughout with precise language: *the old transaction is historically
preserved — its `unit_id`, booking/financial baseline, documents, and workflow/audit history are
never overwritten or reassigned; only its lifecycle status changes.* The underlying business
principle is unchanged — this is a wording correction, not a behavior change.

Files: `phase1-specification-v1.3.1.md`, `workflow-unit-change-v1.3.1.mermaid`,
`App-v1.3.1.jsx` (code comment only)

## 7. Unit Status Mapping

**Fix:** Added an explicit table (new §1.3a) mapping every `units.status` value to the exact
condition on `lifecycle_status`, `status_workflow`, `workflow_instances.status`, and
`financial_exceptions` that produces it. This documents the existing system-derived rule
unambiguously; it does not introduce a second, manually-maintained status system —
`units.status` remains one denormalized column, recomputed by the same trigger described in v1.3.

Files: `phase1-specification-v1.3.1.md` (new §1.3a)

## 8. ERD Relationship Corrections

**Fix:** `erd-v1.3.1.mermaid` updated to show `physical_custody_log.document_id → documents`,
the corrected `source_change_type` note, and `requested_by` on `CANCELLATIONS`,
`UNIT_CHANGE_REQUESTS`, and `CUSTOMER_CHANGE_REQUESTS`. Added attribute blocks for
`PHYSICAL_CUSTODY_LOG` and `CANCELLATIONS`, which had relationships but no attribute listing in
v1.3. No entities or relationships beyond what items 1–3 above required were changed.

Files: `erd-v1.3.1.mermaid`

## 9. @Mention Prototype Fix

**Problem:** The prototype's `addComment` matched `@word` patterns but notified every role
(`toRoles: Object.values(ROLES)`) rather than the specific mentioned person — a real bug against
the spec's "mentioned user receives in-app notification and email" requirement.

**Fix:** Mentions are now resolved against the user master (matching on first name or full name,
case-insensitive) and notify only the resolved user(s), via a new `toUserIds` field on
notifications (kept alongside the existing `toRoles`, used everywhere else unchanged). An
unresolved `@name` that matches no user notifies Super Admin instead of silently doing nothing,
so a typo doesn't just vanish. This is the simplest deterministic lookup, not a new notification
subsystem — the production architecture remains exactly the v1.3 notification design.

Files: `App-v1.3.1.jsx`

## 10. Acceptance Test Updates

**Fix:** `README-v1.3.1.md`'s acceptance checklist gained the physical-custody document-identity
tests (transfer a specific document through three holders and verify each record's document
identity; two documents on one transaction with different current holders simultaneously), plus
one test each for requester-on-request, Unit Change availability rejection, and targeted
@mention. The "physical document holder" test from v1.3 was reworded to reflect the per-document
model rather than the old per-transaction one.

Files: `README-v1.3.1.md`

## 11. Cross-document Consistency

Performed after all corrections above:
- Confirmed `LEGAL_EXECUTIVE`/`LEGAL_EXEC` naming difference between schema (spelled out) and
  prototype (short JS key) is a pre-existing v1.2/v1.3 convention, not a new inconsistency
  introduced here — left as-is, not "fixed," since it was never broken.
- Confirmed no remaining "untouched" wording anywhere in the package after the item 6 fix.
- Confirmed `source_change_type` is not set to anything but `null`/`'UNIT_CHANGE'` anywhere in
  the prototype (grep-verified against `App-v1.3.1.jsx`).
- Confirmed the four workflow diagrams with no required v1.3.1 change (Allocation, ATS, Sale
  Deed, Direct Sale Deed) and the two v1.3 change-request diagrams with no required v1.3.1 change
  (Cancellation, Customer Change) were **not** touched or renamed — per the instruction to leave
  existing v1.3 design untouched where no correction was required, rather than mechanically
  re-versioning files with no actual content change.
- Verified `App-v1.3.1.jsx` parses structurally (balanced braces/parens/brackets) after all edits.

No unrelated improvements were made during this pass.

---

## Files changed

- `phase1-specification-v1.3.1.md` (from `phase1-specification-v1.3.md`)
- `erd-v1.3.1.mermaid` (from `erd-v1.3.mermaid`)
- `workflow-unit-change-v1.3.1.mermaid` (from `workflow-unit-change-v1.3.mermaid`)
- `phase2-wireframes-v1.3.1.html` (from `phase2-wireframes-v1.3.html`)
- `App-v1.3.1.jsx` (from `App-v1.3.jsx`)
- `README-v1.3.1.md` (from `README-v1.3.md`)
- `CHANGELOG-v1.3.1.md` (new, this file)

## Files unchanged (still current at their v1.3 filenames — not duplicated)

- `original-spec.pdf`
- `erd-v1.3.mermaid`, `workflow-allocation-v1.3.mermaid`, `workflow-ats-v1.3.mermaid`,
  `workflow-saledeed-v1.3.mermaid`, `workflow-direct-saledeed-v1.3.mermaid`,
  `workflow-cancellation-v1.3.mermaid`, `workflow-customer-change-v1.3.mermaid`
- `CHANGELOG-v1.3.md` (superseded item-by-item by this file only where item numbers overlap;
  its ambiguities list — Booked By match threshold, Unit Change repricing, per-workflow vs.
  per-stage versioning — is carried forward unresolved, see below)
- All v1.2 files (`README-handoff.md`, `phase1-specification.md`, `erd.mermaid`,
  `workflow-allocation.mermaid`, `workflow-ats.mermaid`, `workflow-saledeed.mermaid`,
  `workflow-direct-saledeed.mermaid`, `App.jsx`, `phase2-wireframes.html`) — kept for historical
  comparison only, per prior instruction not to delete anything.

## Issues not resolved without a business decision

Carried forward unresolved from `CHANGELOG-v1.3.md`, since v1.3.1's scope didn't touch them and
none of the v1.3.1 change items required resolving them:

1. **Booked By fuzzy-match threshold** — schema names `pg_trgm` as the mechanism, no similarity
   cutoff specified.
2. **Unit Change financial carry-forward/repricing** — new transaction currently copies the old
   financial baseline as an unlocked starting point; whether a Unit Change to a different-priced
   unit should force a different starting Sale Deed Value is a business call, not resolved here.
3. **Whole-workflow vs. per-stage versioning** — v1.3.1 kept the whole-workflow versioning model
   from v1.3 (all stages of a workflow type share one version), consistent with the original
   change request's own "Sale Deed Workflow V1/V2" framing. If per-stage versioning was actually
   intended, that's a materially different, more complex model and needs explicit confirmation
   before Phase 3.

No new ambiguities were introduced by this pass.

## Final statement

**v1.3.1 is ready for Phase 3 implementation planning**, on the same conditional basis v1.3 was:
the architecture and business logic are sound and internally consistent, the two genuine bugs
identified across both correction passes (DDL ordering in v1.3, transaction/unit uniqueness in
v1.3) are fixed, and this pass's nine targeted corrections close every gap identified in the
v1.3.1 change request without touching anything that was already correct. What's still needed
before implementation begins, not before sign-off: a database engineer's pass over the DDL
against a real Postgres instance, and the business owner's decision on the three carried-forward
ambiguities above — none of which block starting Phase 3 scaffolding (auth, RBAC skeleton,
project setup) in parallel while those are settled.
