# WO-03 security and deployment assessment

Inspected 2 November 2026. VERIFIED refers to source/metadata inspected, INFERRED
to implications, UNKNOWN to uninspected runtime behaviour. This is a bounded
assessment, not a complete penetration test or release approval.

| Priority | Finding and evidence | Status / next action |
| --- | --- | --- |
| High | Public and admin GET handlers can write catalogue defaults and backfill relationships; no transaction/cross-process lock | VERIFIED source; retain behaviour in WO-03, address proposed WO-04 after tests and data review |
| High | Legacy `prisma/seed.js` includes fixed staff credentials/identities in public source | VERIFIED; values deliberately omitted. UNKNOWN whether deployed accounts retain them. Owner/security review should check account state privately and arrange any needed credential remediation under separate authority; do not run the seed |
| High | Production source revision, PM2 cwd, nginx upstream and migration state are unverified | UNKNOWN; complete approved read-only checklist before release |
| High | Main was reported unprotected; no prior tests/Actions workflow/deployment record | VERIFIED discovery metadata; PR adds checks only. Repository rules/required gates need owner settings review; no settings changed |
| High | Payment UI is a placeholder; primary schema has no payment ledger | VERIFIED; fee policy and payment design required before implementation. Do not transplant the separate prototype |
| High | npm install audit summary reported 27 vulnerabilities: 16 moderate, 9 high, 2 critical | VERIFIED for the installed dependency tree during WO-03; detailed audit timed out at 240 seconds. Two incidental runtime lockfile updates were subsequently restored to baseline. Exact final-lock advisory attribution remains INCOMPLETE; obtain a full reviewed audit and fixes before release. No audit fix/force or runtime upgrade is included |
| Medium | SMTP fallback logs message content, including potentially personal applicant/account data | VERIFIED source; enforce restricted logs/retention and replace fallback with redacted diagnostics in a separate behavioural change |
| Medium | Tracked development stderr files encourage accidental diagnostic publication | VERIFIED; two tracked .err files inspected without copying contents into this report. One was empty; the other was a single short diagnostic. No email-like string, user-path or SMTP-content marker was detected. This is not proof of clean Git history. Removed current files and ignored .err; history remains |
| Medium | Generic dev/migration/seed commands still accept caller environment | VERIFIED; use the new fixed synthetic workflow only. Legacy commands retained for compatibility |
| Medium | Dynamic dependency ranges and unknown production Node/runtime | VERIFIED ranges / UNKNOWN deployed versions; lockfile and development Node pin provide a testable baseline, not an upgrade of production |
| Medium | Complete route authorization, upload validation, session/CSRF controls and dependency advisories have not all been audited | UNKNOWN residual risk; unit tests are limited evidence, not comprehensive security approval |
| Medium | Backups/restoration, shared-host service isolation and log retention are unverified | UNKNOWN; metadata-only VPS review required |

## Separate local Paystack project

VERIFIED: `C:\Users\jerry\MOA Professional Vocational Training` has no Git remote;
branch `master`, HEAD `d1c12d3f08f3da0f25a9e7701fc8dce19c5b3ed5` (30 April 2026).
There are 25 modified/deleted tracked paths. No environment files or live databases
were opened. Tracked working-file content and status were fingerprinted before
and after review to verify preservation. No commands installed or ran that app.

Its Next 14/React 18/Prisma 5 architecture differs from the primary Next 15/React
19/Prisma 6 application. It has normalized Course/Location/Payment relations and
payment-specific registration states, while the primary app has different
registration fields, admin workflows and configurable questions. Similar naming
does not establish common Git ancestry or production provenance. Whether it was
ever deployed, copied from another repository or approved is UNKNOWN.

VERIFIED static strengths: fee amount is obtained server-side from the course;
webhook code checks a signature, verifies the transaction server-side, compares
the amount, checks previously successful payment status and uses a transaction
for payment/registration updates.

VERIFIED gaps requiring redesign/testing:

- Signature uses a separate webhook-secret variable and ordinary string equality.
  Paystack documents HMAC-SHA512 with the merchant secret key. Configuration
  equivalence is UNKNOWN; use the documented key and constant-time comparison.
- Verification checks status/amount but does not explicitly compare the returned
  reference and currency to the stored intent.
- The pre-transaction SUCCESS check is not a concurrency-safe claim; simultaneous
  deliveries can both pass it and cause duplicate downstream notification work.
- Initialization occurs before inserting the payment record; timeout/early-webhook
  races, reconciliation and retries are not fully addressed.
- Signature payload parsing is not guarded against malformed JSON, and provider
  requests have no explicit timeout.
- Upload accepts a registration ID without demonstrating ownership/authentication
  in that handler; files use caller MIME metadata and absolute paths in records.
- Email HTML interpolates submitted names/contact values without explicit escaping
  at those call sites; full template safety remains unverified.
- Schema includes tuitionFee and broad payment states. This is not proof that it
  obeys today's registration-fee-only/free-programme policy or applicant/admission
  state distinctions.

INFERRED recommendation: use it only as design evidence. Build a separately
reviewed integration adapted to the authoritative schema, with synthetic provider
doubles, concurrency-safe idempotency, reconciliation, fee snapshots and clear
application/fee/admission states. Do not merge/copy or activate it in WO-03.

Primary references reviewed: [Paystack webhooks](https://paystack.com/docs/payments/webhooks/)
and [transaction verification](https://paystack.com/docs/payments/verify-payments/).
No Paystack API was called.

## CI and disclosure boundaries

The proposed workflow is PR/manual-check only, read-only token, SHA-pinned
checkout/setup actions, no persisted Git credentials and no production secrets.
One job has no database; a separate job uses an ephemeral synthetic PostgreSQL
service and the guarded synthetic-only schema/fixture setup. There is no deploy,
production migration or legacy staff seed step. Do not upload raw logs, database dumps or
environment snapshots as artifacts. Installing npm packages is not evidence
that all transitive dependencies are vulnerability-free; record audit results
separately and do not apply unreviewed automatic upgrades.
