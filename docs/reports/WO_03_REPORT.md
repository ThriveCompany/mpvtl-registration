# WO-03: Reproducible development baseline and safety controls

Date: 2 November 2026. Repository: ThriveCompany/mpvtl-registration.
Accepted base: `710e7136d7c2f9686c527fdcfb155a7a72df0409`.
Branch: `phase-0/wo-03-development-baseline`.

## Scope and implementation

The original local `main` and HEAD matched the accepted baseline, with a clean
working tree, before creating this dedicated branch. No application handler,
catalogue implementation, production seed, database schema or migration is
changed. The second local project is inspected only.

- Add standalone Next-compatible ESLint configuration and command.
- Add fresh-checkout route-type generation and strict TypeScript validation.
- Add synthetic catalogue, route, authorization and isolation unit tests.
- Add a Node pin, lockfile-based installation, loopback-only PostgreSQL Compose
  setup, synthetic fixture seed and guarded development helper.
- Add PR CI with a read-only token, SHA-pinned actions, no production secrets,
  database service, deployment, migration or staff seed.
- Remove two currently tracked stderr logs and ignore future `.err` files.
- Document catalogue effects/callers, technical risks, Paystack-project suitability,
  a sanitized read-only VPS checklist and proposed WO-04.

## Evidence and validation

Validation is in progress. Do not interpret this draft as a passing-check report.

| Check | Current result |
| --- | --- |
| Baseline branch/HEAD/working tree | PASS before branch creation |
| Docker Linux engine | BLOCKED: Docker Desktop Linux engine pipe unavailable |
| Interactive PostgreSQL fixture setup / browser flow | NOT RUN: requires the unavailable local engine |
| Dependency installation | In progress; registry requests and local processes unusually slow |
| Initial tests | 17 passed, but bootstrap worker startup timed out: overall FAIL, not a passing suite |
| Initial lint/typecheck | Incomplete/failed while installation/configuration was changing; final rerun required |
| Final lint/typecheck/test and hosted CI | Pending |

The test runner is configured for one thread worker to reduce process startup
overhead. No production connections, migrations, seeds, email or payments were
used to validate this batch. Database integration and end-to-end browser behaviour
are not established by the unit suite.

## Findings and follow-up

VERIFIED: four catalogue GET callers can write; partial failure and relationship
backfill behaviour is documented and preserved. Fixed staff credentials exist
in the legacy public seed; values and identities are deliberately omitted.
SMTP fallback can log personal message content. The primary app has a payment
placeholder and no payment ledger; the separate prototype is not a drop-in fit.

UNKNOWN: deployed revision/build, PM2 cwd, nginx routing, migration state,
credential use in production, full dependency exposure and backup restorability.
No VPS session was opened. See:

- [Development instructions](../DEVELOPMENT.md)
- [Catalogue analysis and proposed WO-04](../CATALOGUE_BOOTSTRAP.md)
- [Security/deployment and Paystack assessment](../SECURITY_AND_DEPLOYMENT_RISKS.md)
- [Required read-only VPS evidence](../VPS_READ_ONLY_CHECKS.md)

The next behaviour-changing task should explicitly initialize/repair catalogue
data outside request handling, prove its safe replacement behaviour, and then
remove every GET write. Deployment remains separately authorised work.

PRODUCTION CHANGES: NONE
MAIN BRANCH CHANGES: NONE
PR STATUS: DRAFT PREPARATION; update with actual PR and final evidence before handoff
