# Phase 1 — Database Schema, Permission Matrix, API & Integration Design
### Real Estate Customer Document Workflow & Transaction Management System — v1.3.2

> **Revision note:** this is the final v1.3.2 sign-off correction pass over v1.3.1 —
> `CHANGELOG-v1.3.2.md` is the applicable changelog for this document, covering both the
> original v1.3.2 corrections (physical document identity, the unit status model, unit status
> recomputation, configuration-driven Cancellation approval, the Financial Exception diagram
> correction, the Cancellation+Rebooking financial-snapshot rule, and more) and the final
> sign-off cleanup pass (the `AVAILABLE` derivation wording and stale ERD labels). The
> architecture is now **frozen for implementation** — the only remaining open item is a database
> engineer's review of this DDL against a real Postgres instance, which no revision of this
> package has performed. Everything else has been through successive correction passes and is
> ready to build from. Inline references below to what "v1.3.1" got wrong or changed are
> historical explanations of *why* something reads the way it does now — they don't mean any
> part of this document is still on v1.3.1.

This document is the Phase 1 deliverable called for in §108 of the functional spec: database
schema, entity relationships, permission matrix, API design, Google Drive design, and
notification design. Workflow *state diagrams* are delivered as separate Mermaid files
(`workflow-*.mermaid`, `erd.mermaid`) alongside this document since they need to render as
diagrams rather than text.

Conventions used below:
- All tables have `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` unless noted.
- All tables have `created_at TIMESTAMPTZ DEFAULT now()`; mutable tables also have `updated_at`.
- Nothing is hard-deleted (§94). Soft-delete/lifecycle is handled via `status`/`active` columns.
- The **workflow engine tables** (`workflow_stage_defs`, `workflow_instances`,
  `workflow_actions`) are the core of the system per §2 — every approval/send-back in the
  system, across all workflow types, goes through the same three tables. Nothing is hard-coded
  per screen.
- **Table order in this document is dependency order.** Every `CREATE TABLE` only references
  tables already defined above it. This was a real bug in v1.2 (`documents` was defined after
  `loan_cheque_details`, which references it) — v1.3 reorders sections so the DDL is executable
  top-to-bottom without manual reordering. If you're implementing this against a real Postgres
  instance, running this file's SQL blocks in order should just work.

---

## 1. Database Schema (DDL)

### 1.1 Identity & RBAC

```sql
CREATE TYPE role_code AS ENUM (
  'SUPER_ADMIN','CRM','CRM_EXECUTIVE','CSO','MANAGEMENT',
  'LEGAL_EXECUTIVE','LEGAL_MANAGER','CFO','ADMIN_EXECUTIVE'
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  role          role_code NOT NULL,
  status        TEXT NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE | INACTIVE
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Fine-grained permission overrides layered on top of role defaults (§6 "configure permissions")
CREATE TABLE permission_overrides (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role          role_code NOT NULL,
  permission_key TEXT NOT NULL,       -- matches keys in the Permission Matrix (§2 below)
  allowed       BOOLEAN NOT NULL,
  updated_by    UUID REFERENCES users(id),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
```

### 1.2 Masters

```sql
CREATE TABLE projects (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     TEXT NOT NULL,
  code                     TEXT UNIQUE NOT NULL,
  rera_number              TEXT,
  status                   TEXT NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE | INACTIVE
  start_date               DATE,
  bu_completion_date       DATE,
  direct_sale_deed_applicable BOOLEAN NOT NULL DEFAULT false,
  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE unit_status AS ENUM (
  'AVAILABLE','ALLOCATION_PENDING','ALLOCATION_APPROVED','ATS_IN_PROCESS',
  'ATS_REGISTERED','SALE_DEED_IN_PROCESS','SALE_DEED_REGISTERED',
  'FINANCIAL_EXCEPTION','COMPLETED','CANCELLED','UNIT_CHANGED','SUPERSEDED'
);

CREATE TABLE units (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id),
  unit_number   TEXT NOT NULL,               -- as entered/imported, e.g. "B-901"
  unit_number_key TEXT NOT NULL,             -- normalized: uppercased, all non-alphanumeric stripped, e.g. "B901"
  unit_type     TEXT,
  area          NUMERIC,
  status        unit_status NOT NULL DEFAULT 'AVAILABLE',  -- derived/system-set; see §1.3 for how it's recomputed on transaction lifecycle changes
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, unit_number_key)        -- blocks "B-901" / "B/901" / "B 901" coexisting as distinct units
);

CREATE TABLE source_master (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name     TEXT NOT NULL UNIQUE,     -- Direct, Channel Partner, Agent, Employee Reference, Existing Customer, Other
  active   BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE payment_plan_master (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL UNIQUE,   -- CLP, Down Payment Plan, Time Linked Plan, Custom Plan
  description  TEXT,
  active       BOOLEAN NOT NULL DEFAULT true
);
```

### 1.2a Unit number normalization & bulk import

Manual entry of unit numbers has the same variant-spelling risk as Booked By (§1.2b below) —
"B-901", "B/901", "B 901" and "b901" are all the same unit typed differently. Rather than trust
free-text entry:

- Every unit stores both `unit_number` (display, as entered) and `unit_number_key` (normalized:
  uppercase, all whitespace/hyphens/slashes stripped). The unique constraint is on the *key*, so
  a second entry that normalizes to an existing key is rejected with the conflicting unit shown,
  not silently created as a duplicate.
- **Bulk import (§6 "Bulk import units")** is done via `POST /units/bulk-import` with an
  uploaded `.xlsx` or `.csv` — one `Unit Number` column (plus optional `Unit Type`, `Area`) —
  rather than typing units one at a time. The import runs every row through the same
  normalization/dedup check and returns a per-row result: **Added**, **Skipped — duplicate of
  existing unit X**, or **Skipped — duplicate within this file**.
- Display formatting is left alone — only the *dedup key* is normalized.

### 1.2b Booked By master — normalization, alias & merge *(v1.3 — strengthened)*

v1.2 only had a `UNIQUE (name, type)` constraint, which does nothing to stop "Rajesh Kaurani" /
"Rajesh Kourani" / "RAJESH KAURANI" from becoming three separate masters — exactly the failure
mode §11 of the original spec calls out. v1.3 adds real normalization plus a merge path for
when duplicates slip through anyway (they will — normalization catches typos in whitespace and
case, not genuine misspellings):

```sql
CREATE TABLE booked_by_master (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  name_key       TEXT NOT NULL,      -- normalized: uppercase, whitespace collapsed, punctuation stripped
  type           TEXT NOT NULL,      -- Employee | Agent | Channel Partner | Other
  active         BOOLEAN NOT NULL DEFAULT true,
  merged_into_id UUID REFERENCES booked_by_master(id),  -- set when this record has been merged away
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (name_key, type)
);

-- Alternate spellings that resolve to one canonical master, populated on merge (and manually,
-- if Super Admin already knows of a variant before it's ever mistakenly created as its own row)
CREATE TABLE booked_by_aliases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booked_by_id UUID NOT NULL REFERENCES booked_by_master(id),
  alias_name   TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

**Duplicate warning at creation:** before inserting a new `booked_by_master` row, the API
fuzzy-matches the proposed name (trigram similarity via Postgres' `pg_trgm` extension is
sufficient) against existing active masters and returns candidates for the UI to show as a
"did you mean...?" warning — the user can still proceed and create a genuinely new master, this
is a warning, not a hard block (unlike unit numbers, real names have legitimate near-duplicates:
two different people can be named similarly).

**Merge behaviour:** when Super Admin merges master B into master A:
- `B.merged_into_id = A.id`, `B.active = false` — B is never deleted.
- B's name is inserted into `booked_by_aliases` under A.
- Existing `transactions.booked_by_id` rows that reference B **keep referencing B** — a
  transaction's historical record shouldn't silently change which master it points to.
- Reporting/rollup queries resolve every reference through the `merged_into_id` chain to the
  canonical master, so B's historical transactions count toward A in reports even though the FK
  itself still points at B.
- New transactions can no longer select B (`active = false` masters are excluded from the
  picker); they select A.
- The merge itself is an audited action (`audit_log`, entity_type = `booked_by_master`).

### 1.3 Transaction (the central entity, §15 — one *unit* can have many transactions over time)

**This is the most important correction in v1.3.** v1.2 had
`unit_id UUID NOT NULL UNIQUE REFERENCES units(id)` — a hard, permanent one-to-one between a
unit and a transaction. That's wrong: a unit can be allocated to Customer A, cancelled, and
later re-allocated to Customer B, and Customer A's transaction must remain permanently visible
for history/audit — it was never meant to be one transaction forever, only **one *active*
transaction at a time**.

```sql
CREATE TYPE transaction_lifecycle_status AS ENUM (
  'ACTIVE','CANCELLED','SUPERSEDED'
);
-- ACTIVE     = this is the current, live claim on the unit — whether still in progress or
--              successfully closed. A closed-and-complete transaction is still ACTIVE in this
--              sense; lifecycle_status is about validity/currency, not progress. Progress is
--              status_overall below.
-- CANCELLED  = terminal. Set when a Cancellation request against this transaction is approved.
--              The unit becomes available for a new transaction (see the partial unique index
--              below).
-- SUPERSEDED = terminal. Set when a Unit Change request that originated from this transaction
--              is approved — the customer/booking moved to a different unit, so this
--              transaction is no longer live for *its* unit, but it is not "cancelled" (nothing
--              went wrong; the record just continued under a new transaction_id, on a new
--              unit).

CREATE TABLE transactions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id                  UUID NOT NULL REFERENCES units(id),   -- NOTE: no bare UNIQUE here, see index below
  customer_name            TEXT NOT NULL,          -- §16: name only, no CRM duplication; always the CURRENT customer
  crm_user_id              UUID NOT NULL REFERENCES users(id),

  -- Booking information §12
  client_confirmation_date DATE,
  onboarding_date          DATE,
  source_of_booking_id     UUID REFERENCES source_master(id),
  booked_by_id             UUID REFERENCES booked_by_master(id),
  booking_reference_remark TEXT,                    -- §14: free text, distinct from source
  payment_plan_id          UUID REFERENCES payment_plan_master(id),
  sale_deed_value           NUMERIC NOT NULL,
  kyc_captured              BOOLEAN NOT NULL DEFAULT false,  -- §17: checkbox, not a document upload

  is_direct_sale_deed      BOOLEAN NOT NULL DEFAULT false,   -- §26
  direct_sale_deed_remark  TEXT,

  -- v1.3: lifecycle vs progress are two different questions — see transaction_lifecycle_status above
  lifecycle_status          transaction_lifecycle_status NOT NULL DEFAULT 'ACTIVE',

  -- v1.3: bidirectional navigation for Unit Change without always having to
  -- join through the request tables (§1.9) — set once, at creation, never edited afterward.
  -- v1.3.1 correction: Customer Change does NOT create a new transaction (see §1.9) — it updates
  -- customer_name on the SAME transaction. source_change_type therefore only ever takes the
  -- value 'UNIT_CHANGE' in practice; it is not a general "what kind of change touched this
  -- transaction" flag. Kept as free TEXT rather than an enum in case a future change type is
  -- added, but 'CUSTOMER_CHANGE' is deliberately not a valid value here — customer changes are
  -- tracked entirely via customer_change_requests (§1.9), not via this field.
  source_transaction_id    UUID REFERENCES transactions(id),   -- the transaction this one continues from, if any
  source_change_type       TEXT,                                -- NULL | 'UNIT_CHANGE'

  -- Five independent status dimensions, §103 — these describe PROGRESS, not lifecycle validity
  status_workflow          TEXT NOT NULL DEFAULT 'ALLOCATION_PENDING',
  status_document          TEXT NOT NULL DEFAULT 'PENDING',
  status_financial         TEXT NOT NULL DEFAULT 'PENDING',
  status_handover          TEXT NOT NULL DEFAULT 'PENDING',
  status_overall           TEXT NOT NULL DEFAULT 'IN_PROGRESS',  -- IN_PROGRESS | ATTENTION_REQUIRED | CLOSED

  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);

-- THE FIX: only one ACTIVE transaction per unit, enforced by the database, not application code.
-- CANCELLED and SUPERSEDED transactions are explicitly excluded, so a unit can accumulate many
-- historical transactions and this index never blocks a legitimate new allocation.
CREATE UNIQUE INDEX ux_transactions_unit_active
  ON transactions (unit_id)
  WHERE lifecycle_status = 'ACTIVE';

CREATE INDEX ix_transactions_unit_id ON transactions (unit_id);
CREATE INDEX ix_transactions_source_transaction_id ON transactions (source_transaction_id);
```

**Unit status recomputation:** `units.status` (§9, system-derived, never user-edited) is
recomputed automatically whenever any transaction, workflow, registration, or financial-exception
event that affects it occurs. The mapping and the recomputation mechanism itself are both
finalized below (§1.3a, §1.3b) — v1.3.1's "trigger on transactions" description was incomplete
and has been superseded by those two sections; don't rely on this paragraph, it's kept only as a
pointer.

### 1.3a Unit status — explicit derivation mapping *(v1.3.2 — finalized; corrects v1.3.1)*

`units.status` is entirely computed from its unit's transaction history via a single
authoritative function, `recompute_unit_status(unit_id)` (defined in full in §1.3b below). This
table is the complete, final rule — nothing else may set `units.status` directly, and no manual
edit is ever permitted (§9 of the original spec).

**Evaluation order (v1.3.2 — made explicit; this precedence was previously implicit and led to
an ambiguous reading of `AVAILABLE`, corrected below):**

1. If the unit has a transaction with `lifecycle_status = 'ACTIVE'`, status is derived from
   *that* transaction's workflow progress — one of `ALLOCATION_PENDING` through
   `FINANCIAL_EXCEPTION` in the table below. **A transaction whose Sale Deed has reached
   `COMPLETED` is still `lifecycle_status = 'ACTIVE'` — completing a sale is not a lifecycle
   transition. Only Cancellation and Unit Change change `lifecycle_status`.** This is the
   detail that matters: it means a unit with a completed, successful sale can never fall through
   to step 2 or 3 below and can never show `AVAILABLE` — its ACTIVE transaction's own completed
   state (`COMPLETED` or `FINANCIAL_EXCEPTION`) is what shows, permanently, until something
   *else* changes that transaction's lifecycle (which nothing in the current business rules ever
   does to a completed sale).
2. Otherwise (no ACTIVE transaction), status is derived from the unit's single most recent
   transaction by `created_at`, if one exists: `CANCELLED` → `CANCELLED`; `SUPERSEDED` →
   `UNIT_CHANGED`.
3. Otherwise (the unit has never had any transaction at all) → `AVAILABLE`.

| `units.status` | Condition |
|---|---|
| `AVAILABLE` | **v1.3.2 correction:** the unit has never had any transaction — step 3 above. This is a narrower condition than v1.3.1's wording, which incorrectly suggested a completed-and-terminal transaction could also produce `AVAILABLE`; per the evaluation order above, that can never actually happen, since a completed sale's transaction never leaves `lifecycle_status = 'ACTIVE'`. |
| `ALLOCATION_PENDING` | ACTIVE transaction exists; its Allocation `workflow_instance.status` is not yet `COMPLETED` |
| `ALLOCATION_APPROVED` | Allocation `workflow_instance.status = COMPLETED`; ATS `workflow_instance` does not yet exist (not yet started) |
| `ATS_IN_PROCESS` | ATS `workflow_instance` exists, `status = PENDING` or `SENT_BACK` |
| `ATS_REGISTERED` | **v1.3.2 correction:** a `registration_details` row exists for this transaction's ATS workflow (i.e., the ATS registration stage has been completed) — this means registration *itself* has occurred, regardless of whether the subsequent scan-check/handover stages are done yet. (v1.3.1 incorrectly required the whole ATS workflow, including handover, to be `COMPLETED` — corrected here.) |
| `SALE_DEED_IN_PROCESS` | Sale Deed `workflow_instance` exists, `status = PENDING` or `SENT_BACK`, and no `registration_details` row exists for it yet |
| `SALE_DEED_REGISTERED` | **v1.3.2 correction:** a `registration_details` row exists for this transaction's Sale Deed workflow — registration itself has occurred. Independent of scan/handover progress and independent of `financial_exceptions` (financial compliance is a separate dimension, never a precondition for this status — see item 5 of the v1.3.2 change list). (v1.3.1 incorrectly required zero open financial exceptions for this status — corrected here; see `COMPLETED` and `FINANCIAL_EXCEPTION` below for where financial compliance actually matters.) |
| `COMPLETED` | Sale Deed `workflow_instance.status = COMPLETED` (registration **and** scan-check **and** handover all done) **and** zero OPEN rows in `financial_exceptions` for this transaction |
| `FINANCIAL_EXCEPTION` | Sale Deed `workflow_instance.status = COMPLETED` **but** at least one OPEN row exists in `financial_exceptions` — mutually exclusive with `COMPLETED` on exactly that condition. (A transaction can sit in `SALE_DEED_REGISTERED` for a while first, then move to either `COMPLETED` or `FINANCIAL_EXCEPTION` once the whole Sale Deed workflow finishes — those two are about the *end state*, `SALE_DEED_REGISTERED` is about registration having happened at all.) |
| `CANCELLED` | The unit's most recent transaction (there is no ACTIVE one) has `lifecycle_status = 'CANCELLED'` |
| `UNIT_CHANGED` | **v1.3.2 — corrects a v1.3.1 conflation:** the unit's most recent transaction (there is no ACTIVE one) has `lifecycle_status = 'SUPERSEDED'` — i.e. the customer/booking that was on *this* unit moved to a *different* unit via an approved Unit Change. This is the **unit-facing** status; `SUPERSEDED` (transaction lifecycle) and `UNIT_CHANGED` (unit status) are deliberately two different names at two different layers describing the same underlying event, not a duplicated concept — see the comparison in §1.9c. |
| `SUPERSEDED` | **v1.3.2 clarification:** *not currently produced by any business event in this system.* The enum value is reserved for a possible future unit-master-level event (e.g. a unit record itself being consolidated/renumbered), which is out of scope for v1.3.2 — no redesign or new module is introduced here. Nothing in the current derivation logic ever sets `units.status = 'SUPERSEDED'`; if a future feature needs it, this value is already available without a schema change. |

This is a read/derivation rule, not a second status system — `units.status` remains a single
denormalized column (kept for cheap filtering/reporting), recomputed by `recompute_unit_status`
(§1.3b) whenever any of its inputs change. No screen or API endpoint sets `units.status`
directly; every path goes through this one function.

### 1.3b Unit status recomputation — one authoritative function *(v1.3.2 — replaces the v1.3.1 "trigger on transactions" description)*

v1.3.1 described unit status recomputation as a trigger on `transactions` alone. That's
insufficient: `units.status` depends on `workflow_instances.status` and `financial_exceptions`
too, neither of which is a column on `transactions` — a transaction-only trigger would leave
`units.status` stale whenever, say, a financial exception is resolved without any other change
to the `transactions` row itself.

**Correction:** all derivation logic in the §1.3a table lives in exactly one function,
`recompute_unit_status(unit_id UUID) RETURNS void`, which reads whatever it needs from
`transactions`, `workflow_instances`, `registration_details`, and `financial_exceptions` for that
unit's current transaction and writes the single resulting value to `units.status`. No other
code path — API endpoint, service method, or trigger — computes this independently.

This function must be invoked (via database trigger, service-layer call, or both — either is
fine, as long as coverage is complete) after every one of the following:

1. `transactions` insert or update (lifecycle_status, status_workflow)
2. `workflow_instances` stage/status change
3. `financial_exceptions` creation or resolution
4. Cancellation approval (§1.9)
5. Unit Change approval (§1.9)
6. `registration_details` insert (ATS or Sale Deed registration entered)

Concretely, the cleanest implementation is a small set of `AFTER INSERT OR UPDATE` triggers on
`transactions`, `workflow_instances`, `financial_exceptions`, and `registration_details`, each of
which does nothing but resolve the affected `unit_id` and call
`SELECT recompute_unit_status(unit_id)` — so the derivation logic itself is never duplicated,
only the (trivial) "something relevant changed, go recompute" plumbing is repeated per table.

### 1.9c Cancellation+Rebooking vs. Unit Change — the two are not the same event *(v1.3.2)*

Both events can result in a unit having more than one historical transaction, which makes them
easy to conflate. They are not the same, and the system must keep them visibly distinct
everywhere (database, workflows, reports, audit, UI):

| | **Cancellation + Rebooking** | **Unit Change** |
|---|---|---|
| Trigger | A transaction is cancelled (§1.9); the *same unit* is later allocated again, to anyone | An active transaction's customer/booking is moved to a *different* unit via an approved request |
| Old transaction's `lifecycle_status` | `CANCELLED` | `SUPERSEDED` |
| Old unit's `units.status` | `CANCELLED` | `UNIT_CHANGED` |
| Is a new transaction created? | Yes — but via the **normal allocation process** (§17), completely independently | Yes — automatically, as the direct effect of the approval (§1.9) |
| New transaction's financials | **Never copied from the old one.** Entered fresh through the normal allocation flow, on its own timeline, possibly by a different CRM, for a different customer, at a different Sale Deed Value. See §1.9d. | Copied from the old transaction as an editable starting point (§1.9, already the case since v1.3) — a genuine continuation of the same commercial deal, just on a different unit |
| Linking field | `transactions.previous_cancelled_transaction_id` (§1.9d — new in v1.3.2, purely for navigation/reporting) | `transactions.source_transaction_id` + `source_change_type = 'UNIT_CHANGE'` (§1.3, unchanged since v1.3.1) |
| Same customer possible? | Yes, coincidentally — but treated identically to a different customer; nothing about the rule changes | By definition, the customer/booking continues — it's the same commercial relationship |

### 1.9d Cancellation + Rebooking — financial snapshot independence *(v1.3.2 — new)*

When a cancelled unit is rebooked, the new transaction is a **new commercial transaction** with
its own independent financial snapshot — never a continuation of the old one's numbers, even
when the unit is identical and even when, coincidentally, the customer is the same person again.

- The old (cancelled) transaction's `transaction_financials` row — Sale Deed Value, Basic, GST,
  Running Maintenance, Maintenance Deposit, Stamp Duty, Legal Fees, PNG, TDS, Payment Plan,
  customer, and all other allocation-level booking information — is never modified because of a
  later rebooking. Its only permitted change for the rest of its existence is the lifecycle
  transition it already underwent, `ACTIVE → CANCELLED`.
- The new transaction goes through the **normal Allocation workflow** (§17) exactly as any other
  new transaction would — its own CCF/KYC gate, its own CSO and Management approvals, its own
  `transaction_financials` row entered fresh and independently locked once its own Allocation is
  approved (§19-20). Nothing about the Allocation workflow changes for a rebooking; it isn't a
  special case of Allocation, it's a completely ordinary one.
- **Explicit prohibition:** no code path may copy `transaction_financials` values from a
  cancelled transaction into a new one merely because they share a unit. If a future business
  need arises to actually carry a specific amount forward (e.g. a credit note), that must be a
  distinct, explicit transaction-level adjustment mechanism — not a silent inheritance of the old
  row's values. No such mechanism exists in v1.3.2; none is introduced here.

```sql
ALTER TABLE transactions ADD COLUMN previous_cancelled_transaction_id UUID REFERENCES transactions(id);
-- v1.3.2: purely a navigation/reporting link — "this new transaction happens to follow a
-- cancelled one on the same unit." Set once, automatically, at creation time, by looking up
-- whether the target unit's most recent transaction (if any) is CANCELLED. NEVER used to copy
-- any financial or booking field — see the prohibition above. Deliberately a different field
-- from source_transaction_id (§1.3), which is reserved for Unit Change lineage only (§1.9c) —
-- the two events are not the same and must not share a field, or a query joining "transaction
-- lineage" would silently conflate an ordinary new sale with a continuation of an old one.
```

**Reporting:** the existing Cancellation Report (§3, `reportKey = 'cancellation'`) is extended,
not duplicated, to show — for any transaction with a populated
`previous_cancelled_transaction_id` — the original transaction's customer and Sale Deed Value,
the cancellation date, the new transaction's customer and Sale Deed Value, and a **derived,
never-stored** "Rebooking Price Difference" (`new.sale_deed_value - old.sale_deed_value`),
computed at query time. Nothing about this reporting view writes to either transaction's stored
financial data.

### 1.4 Documents (§73-75, Google Drive as storage — moved ahead of Financials, see note below)

> **v1.3 fix:** in v1.2 this section was numbered §1.7 and appeared *after* Financials (§1.4),
> but `loan_cheque_details.photo_document_id` references `documents(id)` — so the DDL couldn't
> actually run in the order it was written. It's simply moved earlier here; the content is
> otherwise unchanged from v1.2.

```sql
CREATE TYPE document_type AS ENUM (
  'CLIENT_CONFIRMATION_FORM','ATS_CUSTOMER_APPROVAL_EMAIL','ATS_SCAN','SALE_DEED_SCAN',
  'CUSTOMER_RECEIVING_COPY','LOAN_CHEQUE_PHOTO','CANCELLATION_SUPPORT','CUSTOMER_CHANGE_SUPPORT',
  'ATS_PRINT','SALE_DEED_PRINT',   -- v1.3.2: the PHYSICAL document, from the moment it's printed —
                                    -- exists before any scan/Drive upload, see note below
  'OTHER'
);

CREATE TABLE documents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id        UUID NOT NULL REFERENCES transactions(id),
  document_type         document_type NOT NULL,
  google_drive_file_id  TEXT,          -- v1.3.2: now NULLABLE — see note below. NOT NULL for
                                        -- every digital/scanned type; NULL only for ATS_PRINT /
                                        -- SALE_DEED_PRINT rows that don't have a Drive file yet
  physical_document_id  UUID REFERENCES documents(id),  -- v1.3.2: for a scan row, points back at
                                                          -- the ATS_PRINT/SALE_DEED_PRINT row it
                                                          -- came from — see note below
  version               INT NOT NULL DEFAULT 1,
  replaced_document_id  UUID REFERENCES documents(id),   -- §74: old versions never overwritten
  replacement_reason    TEXT,
  uploaded_by           UUID NOT NULL REFERENCES users(id),
  uploaded_at           TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_drive_id_required_for_digital_types CHECK (
    document_type IN ('ATS_PRINT','SALE_DEED_PRINT') OR google_drive_file_id IS NOT NULL
  )
);
```

**Physical document identity, from creation (v1.3.2):** §1.7's `physical_custody_log` needed a
`document_id` to identify *which* physical document moved (v1.3.1) — but a physical ATS or Sale
Deed exists and moves between people well before it's scanned into Drive, and `documents` rows
previously couldn't exist without a `google_drive_file_id`. This is now resolved without a
second document-tracking structure:

1. The moment Legal Executive prints the ATS/Sale Deed (the `legal_exec_print` stage), a
   `documents` row is created with `document_type = 'ATS_PRINT'` (or `'SALE_DEED_PRINT'`) and
   `google_drive_file_id = NULL`. This row's `id` is what `physical_custody_log.document_id`
   references from that point forward — a physical document has an identity from the moment it
   exists, not only once it's digitized.
2. When that physical document is later scanned (the `admin_scan` stage), a **new** `documents`
   row is created with the appropriate digital type (`ATS_SCAN` / `SALE_DEED_SCAN`),
   `google_drive_file_id` set from the actual upload, and `physical_document_id` pointing back
   at the `ATS_PRINT`/`SALE_DEED_PRINT` row from step 1. This keeps the existing Drive-versioning
   model (§74) entirely intact for the digital row — versioning, `replaced_document_id`, etc. all
   still mean exactly what they meant before — while `physical_document_id` is the explicit,
   separate link connecting the physical object's history to its digital record.
3. `physical_custody_log` rows created before this correction (v1.3.1 and earlier) may still
   have `document_id = NULL` — these are **not backfilled**; the correction applies to new
   custody records going forward, per the explicit instruction not to invent historical data.

```text
PHYSICAL DOCUMENT PRINTED  →  documents row (ATS_PRINT, google_drive_file_id = NULL)
        ↓
PHYSICAL CUSTODY MOVEMENTS  →  physical_custody_log.document_id = that row's id
        ↓
SCANNED / UPLOADED  →  new documents row (ATS_SCAN, google_drive_file_id set,
                        physical_document_id = the ATS_PRINT row's id)
        ↓
CONTINUED VERSIONED DIGITAL DOCUMENT HISTORY (§74, unchanged)
```

**Document-type validation at a workflow stage:** a stage that requires a specific document
type (e.g. Allocation's first stage requiring `CLIENT_CONFIRMATION_FORM`) declares it in
`workflow_stage_defs.required_documents` (§1.6, a JSONB array of `document_type` values). The
same backend rule engine described in §1.6b checks this — a SUBMIT/APPROVE action is rejected if
a required document type has no matching row in `documents` for that transaction. This was
already the intent in v1.2's "Enforcement note"; v1.3 makes the mechanism (required_documents on
the stage definition, checked server-side) explicit rather than implied.

### 1.5 Financials

*(Unchanged from v1.2 other than TDS already being included in exception tracking, which was
confirmed and documented in the prior revision — no further correction needed here. Included in
full for completeness since v1.3 is a complete document, not a patch.)*

```sql
CREATE TABLE transaction_financials (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id      UUID NOT NULL UNIQUE REFERENCES transactions(id),
  basic_amount        NUMERIC NOT NULL DEFAULT 0,
  gst_amount          NUMERIC NOT NULL DEFAULT 0,
  running_maintenance NUMERIC NOT NULL DEFAULT 0,
  maintenance_deposit NUMERIC NOT NULL DEFAULT 0,
  stamp_duty          NUMERIC NOT NULL DEFAULT 0,
  legal_fees          NUMERIC NOT NULL DEFAULT 0,
  png_charges         NUMERIC NOT NULL DEFAULT 0,
  tds_amount          NUMERIC,                       -- nullable = N/A
  locked              BOOLEAN NOT NULL DEFAULT false, -- §19: locked once allocation approved
  locked_at           TIMESTAMPTZ,
  locked_by           UUID REFERENCES users(id)
);

-- §20: every Super Admin edit to a locked amount is logged and triggers CFO+Management notification
CREATE TABLE financial_amount_changes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id   UUID NOT NULL REFERENCES transactions(id),
  field_name       TEXT NOT NULL,
  old_value        NUMERIC NOT NULL,
  new_value        NUMERIC NOT NULL,
  difference       NUMERIC GENERATED ALWAYS AS (new_value - old_value) STORED,
  reason           TEXT NOT NULL,
  changed_by       UUID NOT NULL REFERENCES users(id),   -- always SUPER_ADMIN
  changed_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE financial_component AS ENUM (
  'BASIC','GST','RUNNING_MAINTENANCE','MAINTENANCE_DEPOSIT',
  'STAMP_DUTY','LEGAL_FEES','PNG','TDS','LEDGER'   -- LEDGER used for the single ATS ledger check
);

CREATE TABLE financial_receipt_checks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id   UUID NOT NULL REFERENCES transactions(id),
  workflow_type    TEXT NOT NULL,        -- ATS | SALE_DEED
  component        financial_component NOT NULL,
  received         BOOLEAN NOT NULL DEFAULT false,
  checked_by       UUID REFERENCES users(id),
  checked_at       TIMESTAMPTZ,
  remark           TEXT,
  UNIQUE (transaction_id, workflow_type, component)
);

-- An exception is created the moment CFO approves with a component unreceived, and lives
-- independently of workflow/document completion until explicitly resolved. TDS is included —
-- a pending TDS receipt does not block registration; it's tracked and resolved later like any
-- other component (confirmed).
CREATE TABLE financial_exceptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id   UUID NOT NULL REFERENCES transactions(id),
  workflow_type    TEXT NOT NULL,       -- ATS | SALE_DEED
  component        financial_component NOT NULL,
  amount           NUMERIC NOT NULL,
  status           TEXT NOT NULL DEFAULT 'OPEN',  -- OPEN | RESOLVED
  created_at       TIMESTAMPTZ DEFAULT now(),
  resolved_at      TIMESTAMPTZ,
  resolved_by      UUID REFERENCES users(id)
);

CREATE TABLE loan_cheque_details (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id   UUID NOT NULL REFERENCES transactions(id),
  workflow_type    TEXT NOT NULL,       -- ATS | SALE_DEED
  available        BOOLEAN NOT NULL DEFAULT false,
  cheque_date      DATE,
  bank_name        TEXT,
  cheque_number    TEXT,
  amount           NUMERIC,
  photo_document_id UUID REFERENCES documents(id),   -- now valid: documents (§1.4) is defined above
  remark           TEXT
);
```

### 1.6 Workflow engine (§106 — this is the core; every approval in the system uses these tables)

**v1.3 adds workflow-definition versioning.** The engine was already correctly configurable
(stage composition lives in data, not per-screen code) — what was missing was protecting a
transaction already mid-flow from a later configuration change to the same workflow type.
Without versioning, editing the "Sale Deed" stage list to add a new mandatory field would retroactively
apply to transactions already three stages deep, which is not safe.

```sql
CREATE TYPE workflow_type AS ENUM (
  'ALLOCATION','ATS','SALE_DEED','CANCELLATION','UNIT_CHANGE','CUSTOMER_CHANGE'
);

CREATE TABLE workflow_definitions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_type workflow_type NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workflow_definition_versions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_definition_id  UUID NOT NULL REFERENCES workflow_definitions(id),
  version_number          INT NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'DRAFT',  -- DRAFT | ACTIVE | RETIRED
  is_immutable            BOOLEAN NOT NULL DEFAULT false, -- flips true the first time any workflow_instance uses it
  activated_at            TIMESTAMPTZ,
  created_by              UUID REFERENCES users(id),
  created_at              TIMESTAMPTZ DEFAULT now(),
  UNIQUE (workflow_definition_id, version_number)
);

-- v1.3.1: only one ACTIVE version per workflow definition, enforced by the database — this was
-- previously described only as application behavior ("Super Admin activates a version..."),
-- which is real but not sufficient on its own; a concurrent double-activation should be
-- impossible at the data layer too.
CREATE UNIQUE INDEX ux_workflow_definition_versions_one_active
  ON workflow_definition_versions (workflow_definition_id)
  WHERE status = 'ACTIVE';
-- This complements, not replaces, the activation logic in the rules below: the API still does
-- the "retire the old ACTIVE version, then activate the new one" sequence deliberately (so there
-- is never a moment with two ACTIVE rows to begin with), and this index is the backstop that
-- makes it impossible for a bug or a race condition to leave two ACTIVE rows regardless.

-- Configuration, not code: defines every stage of every workflow VERSION, who's responsible,
-- what's required to complete it, and where a send-back can go. Super Admin-editable (§6) —
-- but only while the owning version's status is DRAFT (is_immutable = false).
CREATE TABLE workflow_stage_defs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_definition_version_id UUID NOT NULL REFERENCES workflow_definition_versions(id),
  workflow_type           workflow_type NOT NULL,   -- denormalized for convenient filtering/reporting
  stage_order              INT NOT NULL,
  stage_key                TEXT NOT NULL,        -- e.g. 'CFO_LEDGER_CHECK' — stable identifier,
                                                   -- referenced by send_back_target_stage below
  stage_label               TEXT NOT NULL,        -- e.g. 'CFO Ledger Check'
  required_role              role_code NOT NULL,
  permitted_acting_roles      role_code[] NOT NULL DEFAULT '{}',  -- §66-67 e.g. LEGAL_MANAGER stage → {CRM, CFO}
  required_fields              JSONB NOT NULL DEFAULT '[]',
  required_documents            JSONB NOT NULL DEFAULT '[]',  -- array of document_type values, see §1.4
  allows_send_back                BOOLEAN NOT NULL DEFAULT true,
  send_back_target_stage           TEXT,                -- stage_key to return to
  is_terminal                       BOOLEAN NOT NULL DEFAULT false,
  applicable_if_direct_sale_deed     BOOLEAN NOT NULL DEFAULT true,  -- false for ATS stages, skipped on direct cases
  UNIQUE (workflow_definition_version_id, stage_order),
  UNIQUE (workflow_definition_version_id, stage_key)   -- v1.3.1: stage_key is used as a stable
                                                        -- reference target (send_back_target_stage
                                                        -- above), so it must be unique within a
                                                        -- version too, not just stage_order
);

CREATE TABLE workflow_instances (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id                  UUID NOT NULL REFERENCES transactions(id),
  workflow_type                   workflow_type NOT NULL,
  workflow_definition_version_id  UUID NOT NULL REFERENCES workflow_definition_versions(id),
  -- ^ captured once, at instance start, and never changed — even if a newer version is later
  --   activated. This IS the mechanism for "existing transactions remain on their existing
  --   version." The moment this row is inserted, the referenced version's is_immutable flips
  --   to true (trigger), locking its workflow_stage_defs against further editing.
  current_stage_id                UUID REFERENCES workflow_stage_defs(id),
  status                          TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING | SENT_BACK | COMPLETED | SKIPPED | NOT_APPLICABLE | CANCELLED
  started_at                      TIMESTAMPTZ,
  completed_at                    TIMESTAMPTZ,
  UNIQUE (transaction_id, workflow_type)
);

CREATE TABLE workflow_actions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id),
  stage_id            UUID NOT NULL REFERENCES workflow_stage_defs(id),
  user_id             UUID NOT NULL REFERENCES users(id),
  nominal_role        role_code NOT NULL,     -- the role the workflow addressed
  actual_role         role_code NOT NULL,     -- the logged-in user's real role (§5, §66)
  action               TEXT NOT NULL,          -- SUBMIT | APPROVE | SEND_BACK | COMPLETE
  from_stage_id        UUID REFERENCES workflow_stage_defs(id),
  to_stage_id          UUID REFERENCES workflow_stage_defs(id),
  field_data           JSONB NOT NULL DEFAULT '{}',
  remark               TEXT,                    -- FORMAL remark — see §1.9's internal_comments for the informal kind
  ip_address           INET,
  device_info          TEXT,
  created_at            TIMESTAMPTZ DEFAULT now()
);
```

**Versioning rules:**
- A new workflow version starts `DRAFT` and is freely editable.
- Super Admin **activates** a DRAFT version → its status becomes `ACTIVE`; the previously-ACTIVE
  version for that `workflow_type` (if any) becomes `RETIRED`. Retired versions are never
  deleted — every `workflow_instance` created under them keeps working exactly as before.
  New workflow instances always start on whatever version is currently `ACTIVE`.
- The instant any `workflow_instance` is created referencing a version, that version's
  `is_immutable` flips to `true` — its `workflow_stage_defs` rows can no longer be edited.
  Wanting to change stage composition after that point means creating a new DRAFT version
  (typically cloned from the current one) and activating it once ready; it does not touch
  anything already in flight.
- Reporting can show, e.g., "Sale Deed V1" against an older transaction and "Sale Deed V2"
  against a newer one — this is the visible expression of the rule, not a decoration.

### 1.6b Backend transition validation (mandatory, applies to every workflow action)

The backend — not the UI — is the enforcement point for every stage transition. Every call to
`POST /workflow-instances/:id/actions` (§3) is evaluated as:

```
Current Workflow (workflow_instance.workflow_type + workflow_definition_version_id)
  + Current Stage (workflow_instance.current_stage_id)
  + Logged-in User (from session/auth, never from the request body)
  + Actual Role (users.role for that user, read server-side)
  + Nominal Role (workflow_stage_defs.required_role for the current stage)
  + Delegation (any row in `delegations` matching, active, within date range — §1.9)
  + Allowed Action (SUBMIT | APPROVE | SEND_BACK | COMPLETE, valid for this stage)
  + Required Fields (workflow_stage_defs.required_fields, all present in field_data)
  + Required Documents (workflow_stage_defs.required_documents, all present in `documents`)
  + Exception Rules (e.g. CFO-approve-with-pending-receipts is an explicitly allowed exception,
    not a validation failure — see §1.5's financial_exceptions)
  = Valid → write workflow_actions row, advance current_stage_id, run side effects (§5 notifications)
  = Invalid → reject with a specific reason, write nothing
```

The backend must reject, specifically:
- An approval/send-back attempted by a user whose actual role is neither the stage's
  `required_role` nor in `permitted_acting_roles`, and who has no matching active delegation.
- An action against the wrong stage (stale client state — someone else already advanced it).
- An action against the wrong `workflow_instance_id` for the `transaction_id` implied by the UI.
- A delegation that's expired, not yet started, or references a role the acting user doesn't
  actually hold.
- A SUBMIT/APPROVE missing any `required_fields` or `required_documents` entry.
- A SEND_BACK with no `remark` (mandatory, §68) or targeting a stage not listed as that stage's
  `send_back_target_stage`.
- An attempt to COMPLETE a workflow whose current stage is not `is_terminal`.
- An attempt to act on a `workflow_instance` whose status is already `COMPLETED`, `SKIPPED`, or
  `NOT_APPLICABLE` (reopening is a distinct, Super-Admin-only action — §1.9 `workflow_reopens`
  — not a normal stage action).

This is stated explicitly here because it was previously implied by "server-side validation"
language scattered across the document rather than written as one enforceable rule; nothing
about the underlying architecture changes, this section makes the rule impossible to miss.

### 1.7 Physical custody (§34-35 — tracked as its own operator-driven log, never inferred)

```sql
CREATE TABLE physical_custody_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id   UUID NOT NULL REFERENCES transactions(id),
  document_id      UUID REFERENCES documents(id),   -- v1.3.1: WHICH physical document moved.
                                                       -- v1.3.2: for new records, this should
                                                       -- always be populated — every physical
                                                       -- document now gets a documents row from
                                                       -- the moment it's printed (§1.4), so NULL
                                                       -- here should no longer occur going
                                                       -- forward. Historical NULL rows from
                                                       -- before this correction are left as-is.
  workflow_type    TEXT NOT NULL,        -- ATS | SALE_DEED — kept alongside document_id as a
                                          -- convenient classification; document_id is now the
                                          -- specific identity, workflow_type is the category.
  from_role        role_code,
  from_user_id     UUID REFERENCES users(id),
  to_role          role_code NOT NULL,
  to_user_id       UUID REFERENCES users(id),
  remark           TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);
-- "Physical Document Currently With" for a SPECIFIC document = latest row per document_id.
--
-- Nullable document_id: retained only for historical rows created before v1.3.2 (see §1.4 — a
-- documents row of type ATS_PRINT/SALE_DEED_PRINT now exists from the moment a physical
-- document is printed, so every new custody row has a real document_id from the start; nothing
-- currently produces a NULL document_id going forward).
--
-- This must be a standalone, user-initiated "Transfer Physical Document" action (Control Sheet
-- UI) — it is NEVER auto-inferred from whichever workflow stage is currently active.
```

### 1.8 Registration, scan, sales close, handover, Garvi downloads

*(Unchanged from v1.2 — registration `entered_by` = Legal Executive was already confirmed and
corrected in the prior revision.)*

```sql
CREATE TABLE registration_details (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id        UUID NOT NULL REFERENCES transactions(id),
  workflow_type         TEXT NOT NULL,      -- ATS | SALE_DEED
  sro                   TEXT,
  registration_number   TEXT,
  registration_date     DATE,
  execution_date        DATE,
  other_reference        TEXT,
  entered_by             UUID REFERENCES users(id),   -- Legal Executive, confirmed
  entered_at              TIMESTAMPTZ DEFAULT now(),
  UNIQUE (transaction_id, workflow_type)
);

CREATE TABLE scan_confirmations (   -- §40: Admin — scan + Accounts copy + Sales Close, one combined checkpoint
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id         UUID NOT NULL REFERENCES transactions(id),
  workflow_type          TEXT NOT NULL,
  scanned_by             UUID REFERENCES users(id),
  scanned_at             TIMESTAMPTZ,
  accounts_copy_given    BOOLEAN NOT NULL DEFAULT false,
  sales_close_confirmed  BOOLEAN NOT NULL DEFAULT false,   -- gate: cannot complete without this, acceptance test §109
  remark                 TEXT,
  UNIQUE (transaction_id, workflow_type)
);

CREATE TABLE scan_checks (          -- §41/§57: CRM Executive final check
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id    UUID NOT NULL REFERENCES transactions(id),
  workflow_type     TEXT NOT NULL,
  checked_by        UUID REFERENCES users(id),
  checked_at        TIMESTAMPTZ,
  scan_verified     BOOLEAN NOT NULL DEFAULT false,
  remark            TEXT,
  UNIQUE (transaction_id, workflow_type)
);

CREATE TABLE customer_handovers (   -- §42/§57
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id           UUID NOT NULL REFERENCES transactions(id),
  workflow_type            TEXT NOT NULL,
  handover_date            DATE,
  receiving_copy_document_id UUID REFERENCES documents(id),  -- mandatory for closure, acceptance test §109
  entered_by               UUID REFERENCES users(id),
  entered_at               TIMESTAMPTZ DEFAULT now(),
  UNIQUE (transaction_id, workflow_type)
);

CREATE TABLE garvi_downloads (      -- §53-54, Sale Deed only
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id         UUID NOT NULL UNIQUE REFERENCES transactions(id),
  index_ii_downloaded    BOOLEAN NOT NULL DEFAULT false,
  certified_copy_downloaded BOOLEAN NOT NULL DEFAULT false,
  confirmed_by           UUID REFERENCES users(id),
  confirmed_at           TIMESTAMPTZ,
  skip_permission_by     UUID REFERENCES users(id),   -- Management user, if bypass used
  skip_reason            TEXT,
  skip_at                TIMESTAMPTZ
);
```

### 1.9 Cancellation, Unit Change, Customer Change, Reopen, Delegation, Comments

**Cancellation — explicit lifecycle, approval sequence is configuration-driven (v1.3.2 correction):**

v1.3.1's wording ("Management, + CFO first if financial_implications") read as if the approver
sequence were hard-coded application logic. It is not, and must not become that — Cancellation
is a `workflow_type` in the same `workflow_definitions` / `workflow_definition_versions` /
`workflow_stage_defs` engine as every other workflow (§1.6), and its stage composition is
configuration, exactly like ATS and Sale Deed's. The CFO stage within the Cancellation workflow
definition carries a condition column exactly analogous to `applicable_if_direct_sale_deed`
(already used to skip ATS for Direct Sale Deed cases):

```sql
ALTER TABLE workflow_stage_defs ADD COLUMN applicable_if_financial_implications BOOLEAN;
-- NULL = stage always applies, regardless of the flag (the normal case for most stages).
-- TRUE  = stage only applies when transactions.financial_implications-equivalent flag on the
--         cancellation request is true (used by the CANCELLATION workflow's CFO stage only).
-- Same mechanism, same column *pattern* as applicable_if_direct_sale_deed on the ATS/Sale Deed
-- workflows — no new engine, no cancellation-specific logic in the API.
```

The **default configuration** — which is what a fresh install ships with, and what every diagram
and screen in this package shows — is:

```text
financial_implications = false  →  Management approval only
financial_implications = true   →  CFO approval  →  Management approval
```

But this is data (the Cancellation workflow definition's stage list), not code. A future Super
Admin could reconfigure it (e.g. add a CSO step) the same way they could reconfigure any other
workflow's stages, subject to the same versioning rules (§1.6) — nothing about the Cancellation
approval sequence is special-cased in the API beyond "read the CANCELLATION workflow
definition's currently-ACTIVE version and evaluate its stages," identical to how ATS and Sale
Deed already work.

```text
Transaction A (lifecycle_status = ACTIVE)
     ↓
Cancellation Request  (cancellations row, status = PENDING)
     ↓
Cancellation Approval — stage sequence read from the CANCELLATION workflow definition's active
     version (default configuration: Management only, or CFO → Management if the request has
     financial implications)
     ↓
Transaction A.lifecycle_status → CANCELLED   (recompute_unit_status → units.status = CANCELLED)
     ↓
Unit is now selectable for a brand-new transaction
     ↓
Transaction B may later be created against the same unit — A remains permanently queryable,
its full workflow_actions/documents/financial history preserved (only its lifecycle status
changed, ACTIVE → CANCELLED). See §1.9d for the financial-snapshot independence rule that
applies to any such rebooking.
```

```sql
CREATE TABLE cancellations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id        UUID NOT NULL REFERENCES transactions(id),
  request_date          DATE NOT NULL,
  reason                TEXT NOT NULL,    -- this IS the formal, permanent request remark (v1.3.1
                                           -- confirms this explicitly) — distinct from
                                           -- internal_comments (§1.9 below), never a second
                                           -- duplicate free-text column
  supporting_document_id UUID REFERENCES documents(id),
  financial_implications BOOLEAN NOT NULL DEFAULT false,
  status                TEXT NOT NULL DEFAULT 'PENDING',  -- drives a workflow_instance of type CANCELLATION
  requested_by          UUID NOT NULL REFERENCES users(id),
  created_at             TIMESTAMPTZ DEFAULT now()
);
```

**Unit Change — explicit two-way navigation (v1.3):**

```text
Old Transaction (source unit)             lifecycle_status: ACTIVE → SUPERSEDED on approval
      ↓
Unit Change Request (unit_change_requests row)
      ↓  approved
New Transaction (new unit)                lifecycle_status: ACTIVE
      ↑ new_transaction.source_transaction_id = old_transaction.id
      ↑ new_transaction.source_change_type = 'UNIT_CHANGE'
```

`unit_change_requests` already carried both `old_transaction_id` and `new_transaction_id` in
v1.2 — that part was directionally right. v1.3 adds the same link from the *transaction* side
(`transactions.source_transaction_id`, §1.3) so the new transaction is navigable back to its
origin without a join through the request table, while the request table remains the full
audit record of *why* and *when* the change happened:

```sql
CREATE TABLE unit_change_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_transaction_id UUID NOT NULL REFERENCES transactions(id),
  old_unit_id        UUID NOT NULL REFERENCES units(id),
  new_unit_id        UUID NOT NULL REFERENCES units(id),
  reason             TEXT NOT NULL,    -- formal, permanent request remark — see cancellations note above
  request_date       DATE NOT NULL,
  requested_by        UUID NOT NULL REFERENCES users(id),   -- v1.3.1: was missing
  financial_impact   TEXT,
  status             TEXT NOT NULL DEFAULT 'PENDING',
  new_transaction_id UUID REFERENCES transactions(id),   -- populated once approved; old txn's history, financials, and unit_id are never overwritten or reassigned — only lifecycle_status changes (ACTIVE → SUPERSEDED)
  created_at          TIMESTAMPTZ DEFAULT now()
);
```

On approval: **first, explicit business validation, not just the database constraint** (v1.3.1):
1. Confirm the old transaction's `lifecycle_status` is still `ACTIVE` (it may have been
   cancelled by someone else in the meantime).
2. Confirm the request's `status` is still `PENDING` (not already actioned).
3. Confirm the proposed `new_unit_id` still exists and belongs to a valid, active project.
4. Confirm the new unit currently has **no ACTIVE transaction** — query the same condition the
   partial unique index enforces, rather than relying only on the insert failing.
5. Confirm the new unit's system-derived status (§1.2c below) is consistent with "available."
6. Perform the old→new transaction transition **atomically** (single DB transaction: old row's
   `lifecycle_status` → `SUPERSEDED`, new row inserted, request row's `new_transaction_id`
   populated — all or nothing).
7. If the new unit became unavailable between the request being raised and being approved
   (someone else allocated it in the interim), reject the approval with a clear business error —
   e.g. *"Selected unit is no longer available."* — rather than surfacing a raw database
   constraint violation to the approver.

The partial unique index from §1.3 remains in place as the final concurrency safety net (step 4
above is a pre-check for a good error message; the index is what actually prevents a race
condition from ever producing two ACTIVE transactions on one unit, regardless of what the
application layer checked a moment earlier).

Once created, the new transaction is created fresh (new `id`, `unit_id = new_unit_id`,
`source_transaction_id = old_transaction_id`, `source_change_type = 'UNIT_CHANGE'`,
`lifecycle_status = 'ACTIVE'`), copying booking/financial baseline fields from the old
transaction as a starting point (still editable/re-lockable independently — the new transaction
is a genuinely separate record, not a relabeled old one). The old transaction's `unit_id` is
**never mutated** — it stays permanently associated with the unit it was originally allocated
against, which is what makes its history make sense when read later.

**Customer Change — history via the request table itself, not the audit log alone.** Customer
Change does **not** create a new transaction — corrected and made explicit in v1.3.1 (v1.3's
`transactions.source_change_type` comment previously, incorrectly, implied otherwise; see the
note on that field in §1.3). The existing transaction remains the same transaction throughout;
only its `customer_name` is updated. History lives entirely in `customer_change_requests`:

v1.2 only stored `existing_customer_name`/`proposed_customer_name` on the request and then
overwrote `transactions.customer_name` on approval — meaning the *only* place the old name
survived was the general audit log, which the change list correctly flags as not good enough
for something this specific. v1.3 adds explicit approval fields so the request row itself is a
complete, permanent history entry:

```sql
CREATE TABLE customer_change_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id        UUID NOT NULL REFERENCES transactions(id),
  existing_customer_name TEXT NOT NULL,
  proposed_customer_name TEXT NOT NULL,
  reason                TEXT NOT NULL,    -- formal, permanent request remark — see cancellations note above
  request_date           DATE NOT NULL,
  requested_by            UUID NOT NULL REFERENCES users(id),   -- v1.3.1: was missing
  supporting_document_id UUID REFERENCES documents(id),
  status                 TEXT NOT NULL DEFAULT 'PENDING',
  approved_customer_name  TEXT,             -- v1.3: usually = proposed_customer_name, but kept
                                             -- distinct in case a counter-proposal is approved
  approved_by             UUID REFERENCES users(id),
  approved_at             TIMESTAMPTZ,
  created_at               TIMESTAMPTZ DEFAULT now()
);
```

`transactions.customer_name` always reflects the latest approved change (so the Control Sheet
shows the current customer without a join); `GET /transactions/:id/customer-history` (§3)
returns every row from `customer_change_requests` for that transaction, oldest first — a
complete, permanent, independently-queryable history, not something reconstructed from generic
audit log entries. Rows here are never edited or deleted, same as everything else in this
document.

```sql
CREATE TABLE workflow_reopens (     -- §61, Super Admin only
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id),
  reason               TEXT NOT NULL,
  reopened_by          UUID NOT NULL REFERENCES users(id),
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE delegations (          -- §62-65
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_user_id UUID NOT NULL REFERENCES users(id),
  acting_user_id   UUID NOT NULL REFERENCES users(id),
  nominal_role     role_code NOT NULL,
  delegated_role   role_code NOT NULL,
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  reason           TEXT NOT NULL,
  active           BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_delegation_dates CHECK (start_date <= end_date),
  CONSTRAINT chk_delegation_not_self CHECK (original_user_id <> acting_user_id)
);

CREATE TABLE internal_comments (    -- §68-69, does not move workflow — the INFORMAL counterpart
                                     -- to workflow_actions.remark (§1.6), which is FORMAL
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id    UUID NOT NULL REFERENCES transactions(id),
  user_id           UUID NOT NULL REFERENCES users(id),
  message           TEXT NOT NULL,
  mentioned_user_ids UUID[] NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ DEFAULT now()
);
```

**Delegation validation rules (v1.3, explicit):**
- `original_user_id` must actually hold `nominal_role` at the moment the delegation is created
  — validated server-side against `users.role`, not trusted from the request.
- `start_date <= end_date` and `original_user_id <> acting_user_id` are DB-level constraints
  (above), not just UI checks.
- A delegation is only honored (in the §1.6b evaluation) if `active = true` **and** today's date
  falls within `[start_date, end_date]` — expired or not-yet-started rows are inert without
  needing to be deleted.
- Overlapping delegations for the same `(original_user_id, nominal_role)` are permitted to
  exist as rows (no DB constraint prevents it) but are **not merged or reconciled** — at
  evaluation time, if more than one matching active delegation is found, the most recently
  created one wins and this is logged, so an accidental double-delegation doesn't silently pick
  an arbitrary one.
- Both delegation creation and delegation end (detected by the 10 AM daily job scanning for
  `end_date` = yesterday) are notification-triggering events (§5).

### 1.10 Notifications & Audit

```sql
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  transaction_id  UUID REFERENCES transactions(id),
  type            TEXT NOT NULL,     -- see Notification Design §5 below for the full trigger list
  message         TEXT NOT NULL,
  channel         TEXT NOT NULL,     -- EMAIL | IN_APP
  status          TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING | SENT | FAILED
  retry_count     INT NOT NULL DEFAULT 0,
  read            BOOLEAN NOT NULL DEFAULT false,
  read_at         TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Append-only. No UPDATE or DELETE grants at the DB-role level for any application user (§71, §94).
-- v1.3: this is not just a comment — provision the database role the application connects as
-- with INSERT + SELECT only on this table, nothing else, at the Postgres GRANT level. No
-- application code path should be able to edit or delete a row here even if a bug tried to.
CREATE TABLE audit_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type    TEXT NOT NULL,
  entity_id      UUID NOT NULL,
  user_id        UUID REFERENCES users(id),
  actual_role    role_code,
  nominal_role   role_code,
  action         TEXT NOT NULL,
  old_value      JSONB,
  new_value      JSONB,
  document_id    UUID REFERENCES documents(id),
  remark         TEXT,
  ip_address     INET,
  device_info    TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

**No client-trusted identity, anywhere (v1.3, explicit):** every field that identifies *who* did
something — `user_id`, `actual_role`, `nominal_role`, `ip_address`, `device_info` on both
`workflow_actions` and `audit_log` — is populated from the authenticated server-side session,
never from any value the client sends in the request body. A client claiming to be a different
user or role is not a validation error to catch — it's a field the server doesn't read from the
client at all.

**Enforcement note:** §21 requires CCF-upload + KYC-checkbox validation on the *server*. This is
one instance of the general rule in §1.6b — the Allocation workflow's first stage declares
`CLIENT_CONFIRMATION_FORM` in `required_documents` and references `transactions.kyc_captured` in
`required_fields`; the same evaluation that rejects any other incomplete stage rejects this one.
Sales Close (§40, acceptance test §109) and Customer Handover (§42, §109) gates work identically
— they are not special-cased, they're the same rule applied to different stages.

---

## 2. Permission Matrix

*(Unchanged from v1.2 — no change list item required a permission-matrix correction. Carried
forward in full for completeness.)*

Legend: **F** = full, **O** = own records/tasks only, **A** = approve/send-back at their stage,
**–** = no access. This is the default `role` behavior; `permission_overrides` can adjust
individual keys per §6.

| Capability | Super Admin | CRM | CRM Exec | CSO | Mgmt | Legal Exec | Legal Mgr | CFO | Admin Exec |
|---|---|---|---|---|---|---|---|---|---|
| Create/edit Project & Unit master | F | – | – | – | – | – | – | – | – |
| Create/edit Source / Booked By (incl. merge) / Payment Plan masters | F | – | – | – | – | – | – | – | – |
| Create/deactivate users, assign roles | F | – | – | – | – | – | – | – | – |
| Configure workflow stages / activate workflow versions | F | – | – | – | – | – | – | – | – |
| Create Unit Allocation | – | O | – | – | – | – | – | – | – |
| CSO Approve / Send Back (Allocation) | – | – | – | A | – | – | – | – | – |
| Management Approve / Send Back (Allocation / ATS / Sale Deed — 3 independent gates) | – | – | – | – | A | – | – | – | – |
| Upload Customer ATS approval email PDF | – | O | – | – | – | – | – | – | – |
| Legal Executive: print ATS/Sale Deed, Garvi ref, SRO registration entry, Index II/Cert. copy confirm | – | – | – | – | – | O | – | – | – |
| Legal Manager: verify / final verify | – | – | – | – | – | – | A | – | – |
| CFO: ledger check, receipt checklist, loan cheque | – | – | – | – | – | – | – | O | – |
| CRM: obtain & record customer signature | – | O | – | – | – | – | – | – | – |
| CRM Exec: scan check, handover | – | – | O | – | – | – | – | – | – |
| Admin Exec: scan, Accounts copy, Sales Close confirm | – | – | – | – | – | – | – | – | O |
| Act as Legal Manager (no formal delegation, §66) | – | O | – | – | – | – | – | O | – |
| Formal delegation (grant) | – | – | – | – | – | O→{CRM,LM} | O→{CRM,CFO} | O→{Mgmt} | – |
| Transfer physical custody | – | O | O | – | – | O | O | O | O |
| Raise Cancellation / Unit Change / Customer Change request | – | O | – | – | – | – | – | – | – |
| Approve Cancellation / Unit / Customer Change | – | – | – | – | A | – | – | A* | – |
| Reopen a completed workflow | F | – | – | – | – | – | – | – | – |
| Change a locked financial amount | F | – | – | – | – | – | – | – | – |
| View own tasks / pending-with-others | – | O | O | O | O | O | O | O | O |
| View dashboards (unit/project/financial/exception) | F | F | F | F | F | F | F | F | F |
| View full audit trail | F | – | – | – | – | – | – | – | – |
| Export data / reports | F | – | – | – | F | – | – | F (financial only) | – |
| @mention / internal comments | F | F | F | F | F | F | F | F | F |

\* CFO approval required only where the request has financial implications (§58). Physical
custody transfer is listed as `O` (own) for every operational role since it's a record of a
real-world handoff either party to the handoff can log, not a gated approval.

---

## 3. API Design (REST, illustrative — group by resource)

Auth: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`

**Masters** (Super Admin only for writes)
`GET/POST /projects`, `PATCH /projects/:id`
`GET/POST /units`, `PATCH /units/:id`
`POST /units/bulk-import` — see §1.2a
`GET/POST/PATCH /masters/sources`, `/masters/payment-plans`
`GET/POST/PATCH /masters/booked-by` — create returns duplicate-candidate warnings (§1.2b)
`POST /masters/booked-by/:id/merge` — body `{ mergeIntoId }` (§1.2b)
`GET/POST/PATCH /users`

**Workflow definitions** (Super Admin only, §1.6)
`GET /workflow-definitions/:type/versions`
`POST /workflow-definitions/:type/versions` — clone-from-current or start blank, status DRAFT
`PATCH /workflow-definitions/:type/versions/:versionId` — rejected if `is_immutable = true`
`POST /workflow-definitions/:type/versions/:versionId/activate`

**Transactions**
`POST /transactions` — create allocation (server validates CCF + KYC per §21); rejected if the
target unit already has an ACTIVE transaction (§1.3's partial unique index)
`GET /transactions/:id` — full control-sheet view (§81)
`GET /transactions?project=&unit=&customer=&stage=&crm=&status=&lifecycle=` — search (§88);
`lifecycle` defaults to `ACTIVE` only, pass `lifecycle=ALL` to include cancelled/superseded history
`GET /units/:id/transactions` — every transaction ever created against a unit, active or historical
`GET /transactions/:id/customer-history` — full `customer_change_requests` history (§1.9)
`GET /transactions/:id/timeline` (§84)
`GET /transactions/:id/control-sheet.pdf` (§83)
`GET /transactions/:id/summary` (§104, exportable PDF/Excel)

**Workflow actions** (all approvals/send-backs funnel through this one endpoint shape; validated per §1.6b)
`POST /workflow-instances/:id/actions` — body: `{ action: SUBMIT|APPROVE|SEND_BACK|COMPLETE, fields, remark, actingAsRole? }`
`GET /workflow-instances/:id` — current stage, status, version, full action history
`POST /transactions/:id/direct-sale-deed` — flag a transaction as Direct Sale Deed (§26)

**Financials**
`GET/PATCH /transactions/:id/financials` (PATCH restricted to Super Admin post-lock, §19-20)
`POST /transactions/:id/financial-receipts` — CFO per-component receipt check (§46)
`GET /financial-exceptions?status=OPEN`
`POST /financial-exceptions/:id/resolve`
`POST /transactions/:id/loan-cheque`

**Documents & physical custody**
`POST /transactions/:id/documents` — uploads to Drive, returns file ID + version (§73-74)
`GET /transactions/:id/documents`
`POST /transactions/:id/physical-custody` — body: `{ documentId?, workflowType, toRole, toUserId, remark }`
(§1.3.1: `documentId` identifies the specific physical document that moved — required whenever a
matching `documents` row already exists; standalone user action, never implied by a workflow-stage transition, §1.7)
`GET /transactions/:id/physical-custody?documentId=` — full history; filter by a specific document, or omit to see every document's custody log for the transaction
`GET /transactions/:id/physical-custody/current?documentId=` — current holder for one specific document (§1.3.1 — previously this could only answer for the transaction as a whole)

**Registration / scan / handover**
`PUT /transactions/:id/registration` (ATS or Sale Deed)
`POST /transactions/:id/scan-confirmation` (Admin Exec, gated on Sales Close, §40/§109)
`POST /transactions/:id/scan-check` (CRM Exec, §41/§57)
`POST /transactions/:id/customer-handover` (gated on receiving copy, §42/§109)
`POST /transactions/:id/garvi-downloads` (§53-54, incl. Management skip exception)

**Cancellation / Change / Reopen / Delegation**
`POST /transactions/:id/cancellation-request`, `POST /cancellations/:id/actions`
`POST /transactions/:id/unit-change-request`, `POST /unit-change-requests/:id/actions`
`POST /transactions/:id/customer-change-request`, `POST /customer-change-requests/:id/actions`
`POST /workflow-instances/:id/reopen` (Super Admin)
`POST/GET /delegations`

**Comments**
`POST /transactions/:id/comments` — internal (informal) comment, supports `@mentions`; distinct
from a workflow action's `remark` field (§1.6, §1.9)
`GET /transactions/:id/comments`

**Notifications, dashboards, reports, audit**
`GET /notifications/mine`, `POST /notifications/:id/read`
`GET /dashboard/summary`, `GET /dashboard/project/:id`, `GET /dashboard/unit/:id`
`GET /dashboard/financial` — Financial Management Dashboard (§90): completed Sale Deeds,
exception counts, total pending amount broken down per component, drill-down by component
`GET /reports/:reportKey` — one endpoint per named report (§89), all support project/date
filters; `reportKey` is one of: `unit-status`, `workflow-pending`, `department-pending`,
`user-pending`, `financial-exception`, `registration`, `handover`, `cancellation`, `unit-change`,
`customer-change`, `direct-sale-deed`, `management-exception`, `super-admin-financial-change`,
`legal-manager-acting`, `physical-custody`, `complete-audit`, `booking-source`, `booked-by`,
`payment-plan`
`GET /audit-log?entity=&entityId=` (Super Admin only)
`GET /my-tasks`, `GET /pending-with-others`

Every mutating endpoint writes to `audit_log` server-side (not client-reported) with
`user_id`, `actual_role`, `nominal_role`, `ip_address`, `device_info` captured from the request
context — never trusted from the request body.

---

## 4. Google Drive Design

*(Unchanged from v1.2 — no change list item required a correction here.)*

**Folder structure** (§73):
```
/{Project Name}/{Unit Number}/{Transaction ID}/
    ATS/
        client-confirmation-form/
        customer-approval-email/
        registered-scan/
    SaleDeed/
        registered-scan/
        receiving-copy/
        loan-cheque-photo/
```
- `documents.google_drive_file_id` stores Drive's file ID, not a URL. The folder path above is
  recreated from `project.name` / `unit.unit_number` / `transaction.id` at upload time.
- Note the path includes `transaction_id`, not just `unit_number` — since a unit can now have
  multiple historical transactions (§1.3), this was already correctly transaction-scoped in
  v1.2 and needs no change; a cancelled transaction's Drive folder remains its own, untouched by
  whatever transaction comes next for that unit.
- **Versioning (§74):** a re-upload never overwrites — new `documents` row, `version =
  previous + 1`, `replaced_document_id` points at the prior row. Nothing is deleted from Drive.
- **Failure handling (§99):** if the Drive API call fails, the scan/upload action is *not*
  recorded as complete — rolled back together with the Drive call, UI shows the error, retry.
- Drive connected via a domain-wide service account or shared drive under the organisation's own
  Google Workspace (§101), not a personal account.

---

## 5. Notification Design

### 5.1 Event → recipients → channel

| Event | Recipients | Channel |
|---|---|---|
| Task assigned / stage now pending on you | Responsible role's user(s) | Email + In-app |
| Send Back | Original submitter | Email + In-app |
| Resubmission after Send Back | Whoever sent it back | Email + In-app |
| Delegation created | Original user + acting user | Email + In-app |
| Delegation ended (detected by daily job) | Original user + acting user | Email + In-app |
| Financial exception created (CFO approved with pending items) | CFO, Management, CRM | Email + In-app |
| Post-scan financial alert (registered+scanned but items still pending) | CFO, Management, CRM | Email + In-app |
| Super Admin changes a locked financial amount | CFO, Management | Email + In-app |
| Booked By master merge | Super Admin (confirmation) | In-app |
| Scan completed | CRM Executive (next stage) | In-app |
| Handover pending too long (surfaced via daily pendency, no SLA escalation in V1, §102) | — | Daily report only |
| Management exception (Direct Sale Deed, Index II skip, reopen, override) | Management | Email + In-app |
| Workflow reopened | Original workflow's participants + Management | Email + In-app |
| Cancellation / Unit change / Customer change requested or actioned | Approvers at each stage + CRM | Email + In-app |
| @mention (internal comment) | Mentioned user | Email + In-app |

### 5.2 Daily pendency job (§76-77)
Runs every day at 10:00 AM, per organisation timezone:
- Every user → their own `my-tasks` list, emailed individually.
- CFO, CSO, Management → the comprehensive cross-project pendency report (§77 columns).
- Also scans `delegations` for rows whose `end_date` is yesterday, to fire the "delegation
  ended" notification above.
- Implemented as a scheduled job querying `workflow_instances` joined to `workflow_stage_defs`
  and `financial_exceptions`, rendered to an emailed table/PDF and also written to
  `notifications`.

### 5.3 Failure handling (§98)
Unchanged from v1.2 — email failures are logged and retried without blocking or rolling back the
underlying workflow action.

---

## 6. What's next

Diagrams accompanying this document — the current, applicable set at v1.3.2:
- `erd-v1.3.2.mermaid` — current ERD, includes the v1.3.2 physical-document-identity,
  Cancellation+Rebooking, and unit-status corrections
- `workflow-cancellation-v1.3.2.mermaid`, `workflow-saledeed-v1.3.2.mermaid` — updated for the
  configuration-driven approval sequence and the Financial Exception parallel-fork correction
- `workflow-allocation-v1.3.mermaid`, `workflow-ats-v1.3.mermaid`,
  `workflow-direct-saledeed-v1.3.mermaid`, `workflow-customer-change-v1.3.mermaid` — still
  current, no correction applied to any of them since v1.3
- `workflow-unit-change-v1.3.1.mermaid` — still current, its only correction (wording) was in
  the v1.3.1 pass

See `CHANGELOG-v1.3.2.md` for the full item-by-item disposition of every correction pass and
`README-v1.3.2.md` for current status language.
