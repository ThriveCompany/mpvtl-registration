# WO-03: Reproducible development baseline and safety controls

Date: 2 November 2026. Repository: ThriveCompany/mpvtl-registration.
Accepted base: `710e7136d7c2f9686c527fdcfb155a7a72df0409`.
Branch: `phase-0/wo-03-development-baseline`.

## Scope and implementation

The original local `main` and HEAD matched the accepted baseline, with a clean
working tree, before creating this dedicated branch. No application handler,
catalogue implementation, production seed, database schema or migration is
changed. The second local project is inspected only.
The sole application-page edit escapes a JSX apostrophe to satisfy lint;
the displayed text is unchanged. No lint rules are disabled.

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

Database-free checks passed locally and in a clean GitHub Actions Linux checkout.
The interactive environment is provided but not fully exercised on this host.

| Check | Current result |
| --- | --- |
| Baseline branch/HEAD/working tree | PASS before branch creation |
| Docker Linux engine | BLOCKED: Docker Desktop Linux engine pipe unavailable |
| Interactive PostgreSQL fixture setup / browser flow | NOT RUN: requires the unavailable local engine |
| Dependency installation | PASS; dev dependencies and lockfile added; installation lifecycle scripts disabled |
| Prisma client generation | PASS; no database connection |
| Local TypeScript validation | PASS, exit 0; route types generated first |
| Local automated tests | PASS: 5 files, 25 tests, exit 0 |
| Hosted lint/typecheck/tests | PASS: [run 41502948138](https://github.com/ThriveCompany/mpvtl-registration/actions/runs/41502948138), code revision `1558ca48c8e6326690dd39c14eba09d8c98140f9`; six existing hook warnings remain |
| Initial failed checks | Explicitly superseded: worker-start/cold-import timeouts and JSX lint error; fixed with single thread, collection-time route imports and unchanged rendered apostrophe |
| Dependency security | INCOMPLETE: install audit summary 27 findings (16 moderate, 9 high, 2 critical); detailed audit timed out at 240 seconds; no automatic fixes applied |
| Second Paystack project preservation | PASS: tracked-file/status fingerprint unchanged, including all 25 previously changed/deleted paths |
| Main branch | PASS: remains `710e7136d7c2f9686c527fdcfb155a7a72df0409` locally and as PR base |

The lockfile's two incidental runtime-package updates from adding test tooling
were restored to baseline; no existing runtime-package version is intentionally
upgraded. Check the current PR-head CI result after that final lockfile-only
adjustment. The linked run proves clean `npm ci --ignore-scripts`, Prisma
generation, lint, typecheck and all 25 tests on Linux. Final PR-head results are
also recorded in the PR description. No production build or release was run.

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
credential use in production, complete dependency advisory attribution and backup restorability.
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
PR STATUS: OPEN DRAFT — https://github.com/ThriveCompany/mpvtl-registration/pull/1
