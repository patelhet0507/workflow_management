# Hand-off Package — v1.3.2
### Real Estate Customer Document Workflow & Transaction Management System

This is the **final sign-off correction release**. Per the v1.3.2 change request, the
architecture is now treated as **FROZEN for implementation** once the items below are verified
against the checklist in §4. No redesign, no new modules, no settled-decision reversals happened
in this pass — see `CHANGELOG-v1.3.2.md` for the exact, narrow list of what changed.

## 1. Status

- **Phase 1 (Foundations) — FROZEN, ready for implementation**, pending only a database
  engineer's pass against real Postgres (never done in any revision of this package — still the
  one open item that isn't a documentation/architecture question).
- **Phase 2 (UI wireframes) — FROZEN.** All 10 screens (Dashboard, Financial Dashboard, Control
  Sheet, Sale Deed Action, Direct Sale Deed, Change Requests, Global Search, My Tasks, Reports,
  Audit Trail) are structural layout references, not final visual design.
- **Phase 3 (Core engine) — Not Started.** This package is what Phase 3 is built from.
- **`App-v1.3.2.jsx` — Interactive Business-Logic Prototype. Not production code, and not a
  UI/visual reference.** Where it's simplified relative to the wireframes or spec, the
  wireframes and spec are authoritative — see the note at the top of the file itself and §3
  below.

## 2. What changed from v1.3.1 (final corrections)

One line each — full detail with rationale in `CHANGELOG-v1.3.2.md`:

1. Physical documents now get an identity (`documents` row, type `ATS_PRINT`/`SALE_DEED_PRINT`)
   the moment they're printed — before any Drive upload — so custody tracking never depends on a
   NULL document reference for a new physical document again.
2. Every unit status in the original spec's enum (`ATS_REGISTERED`, `SALE_DEED_REGISTERED`,
   `COMPLETED`, `UNIT_CHANGED`, `SUPERSEDED`, etc.) now has one unambiguous, documented
   derivation rule. In particular: `ATS_REGISTERED`/`SALE_DEED_REGISTERED` now correctly mean
   "registration itself happened," not "the entire workflow including handover is done."
3. Unit status recomputation is now one authoritative function
   (`recompute_unit_status(unit_id)`), invoked from every table that can affect it — not just a
   trigger on `transactions`, which could leave status stale.
4. Cancellation's approval sequence (Management-only vs. CFO→Management) is now explicitly
   documented as **configuration**, read from the same workflow-definition engine as every other
   workflow — not hard-coded application logic. The behavior is unchanged; only the "this is
   data, not code" framing was missing before.
5. The Sale Deed diagram now shows Financial Exception as a genuine parallel fork, not a node
   that visually sits inline in the main sequence.
6. Fixed a stale ERD label that implied Customer Change created transaction lineage — it never
   does; `source_transaction_id` is Unit Change only.
7. Added a Global Search wireframe screen (§88) — was covered by the API design but had no UI
   entry point.
8. **New business rule, fully specified and implemented:** Cancellation + Rebooking now has an
   explicit financial-snapshot-independence rule. A cancelled transaction's Sale Deed Value and
   every financial component remain permanently untouched; a rebooking of the same unit goes
   through the ordinary Allocation process with its own independent numbers — never copied from
   the old transaction. The link between the two is tracked (for reporting only) via a new,
   deliberately separate field from Unit Change's lineage field.
9. Explicit "prototype vs. authoritative spec" statement added to the top of `App-v1.3.2.jsx`
   and this README.

## 3. Known limitations (carried forward, unchanged in substance)

- Booked By duplicate detection in the prototype is exact-match, not fuzzy.
- Workflow-definition versioning in the prototype is a simplified version tag, not the full
  DRAFT→ACTIVE→RETIRED lifecycle.
- Only 4 of 19 reports are wired to real prototype data (Financial Exception, Legal Manager
  Acting, Physical Custody, and — new in v1.3.2 — Cancellation/Rebooking).
- `App-v1.3.2.jsx` has no real backend, auth, database, Drive, or email.
- **Where App.jsx is simplified relative to the Phase 2 wireframes or Phase 1 specification,
  those two documents are authoritative — App.jsx is a business-logic and UI demonstration
  only, never the source of truth for exact behavior.**

## 4. Acceptance checklist

Everything from v1.3.1's checklist, plus the v1.3.2 additions:

- [ ] Allocation cannot be submitted without CCF upload and KYC checkbox (server-side)
- [ ] Unit Allocation, ATS, and Sale Deed Management approvals are three fully independent gates
- [ ] Every Send Back requires a remark and preserves full history
- [ ] Direct Sale Deed correctly shows ATS as "Not Applicable / Skipped," never as pending
- [ ] Complete end-to-end ATS and Sale Deed workflows run stage to stage
- [ ] CFO can approve Sale Deed with pending receipts (incl. TDS); workflow continues regardless
- [ ] Later receipt confirmation closes the financial exception independently of document status
- [ ] Super Admin changing a locked financial amount creates an audit entry and notifies CFO + Management
- [ ] CRM/CFO can perform the Legal Manager function without formal delegation
- [ ] Two different people can perform first and final legal verification, both recorded separately
- [ ] Admin cannot complete the scan step without Sales Close Confirmation
- [ ] Workflow cannot close without the customer receiving-copy upload
- [ ] Only Super Admin can reopen a completed workflow
- [ ] Allocate a unit, cancel, allocate the same unit again — both transactions permanent, only the second active
- [ ] Unit Change: new transaction created; old transaction's `unit_id`/financials/history never overwritten; lifecycle → SUPERSEDED
- [ ] Customer Change: current customer updates on the SAME transaction; no new transaction created; original customer stays visible via request history
- [ ] Transfer a specific physical document through three holders; two documents on one transaction show different current holders
- [ ] Every change request (Cancellation/Unit Change/Customer Change) permanently records who raised it
- [ ] Unit Change approval against a no-longer-available unit is rejected with a clear business error
- [ ] `@mention` notifies only the specific mentioned user
- [ ] **New (v1.3.2):** print an ATS or Sale Deed — a document identity exists immediately, before any scan, and physical custody can be transferred against it right away
- [ ] **New (v1.3.2):** scan that same document — a new digital document record is created, correctly linked back to the physical print record, without altering the print record itself
- [ ] **New (v1.3.2):** register an ATS (or Sale Deed) but leave scan/handover incomplete — unit status shows `ATS_REGISTERED` (or `SALE_DEED_REGISTERED`), not still "in process"
- [ ] **New (v1.3.2):** complete a Sale Deed's full workflow with an open financial exception — unit status shows `FINANCIAL_EXCEPTION`, not `COMPLETED`; resolving the exception later moves it to `COMPLETED` without any further workflow action
- [ ] **New (v1.3.2):** approve a Unit Change — old unit's status shows `UNIT_CHANGED`; confirm no unit anywhere shows `SUPERSEDED` (reserved, unused by current business rules)
- [ ] **New (v1.3.2):** resolve a financial exception or complete a workflow stage via a path that does NOT touch the `transactions` table directly (e.g. resolving an exception) — unit status still updates correctly (tests the single-function recomputation, not just the transaction-triggered path)
- [ ] **New (v1.3.2):** raise a Cancellation with `financial_implications = false` — confirm the approval path is Management-only per the *configured* default, not because it's hard-coded
- [ ] **New (v1.3.2):** use Global Search to find a transaction by Registration Number or Booked By — result opens the correct Control Sheet
- [ ] **New (v1.3.2), the big one:** book Unit A-101 for Customer A at ₹1.00 Cr, lock financials, cancel, rebook A-101 for Customer B at ₹1.20 Cr, lock the new financials. Verify: the old transaction still shows ₹1.00 Cr with every original component unchanged; the new transaction shows ₹1.20 Cr with its own independently captured components; neither transaction's financial data was copied from or into the other; the two are linked for reporting; the Cancellation Report shows both values and the price difference without having modified either stored value.
- [ ] **New (v1.3.2 sign-off cleanup):** take a unit's transaction all the way through Sale Deed completion — workflow `COMPLETED`, zero open financial exceptions, and (correctly) no `ACTIVE` transaction check ever removes it from that state. Verify `units.status = COMPLETED`, **not** `AVAILABLE` — the unit must never appear selectable for a fresh allocation while a completed sale sits on it.
- [ ] **New (v1.3.2 sign-off cleanup):** same scenario, but with one financial component left unreceived at Sale Deed completion. Verify `units.status = FINANCIAL_EXCEPTION`, not `AVAILABLE` and not `COMPLETED` — and that resolving the last open exception later flips it to `COMPLETED` without any workflow action, matching the existing (unchanged) financial-independence rule.

If every box above is true, the system meets the spec's own bar for success (§110 of the
original spec), and the architecture is ready to build from.
