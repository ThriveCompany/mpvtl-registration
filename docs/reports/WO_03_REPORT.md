# WO-03: Reproducible development baseline and safety controls

Date: 2 November 2026; review corrections verified 6 November 2026.
Repository: ThriveCompany/mpvtl-registration.
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
- Add PR CI with a read-only token, SHA-pinned actions, database-free unit checks
  and a separate ephemeral synthetic-database setup/idempotency check. No
  production secrets, deployment, production migrations or staff seed.
- Remove two currently tracked stderr logs and ignore future `.err` files.
- Document catalogue effects/callers, technical risks, Paystack-project suitability,
  a sanitized read-only VPS checklist and proposed WO-04.

## Evidence and validation

Build-validation correction tested at exact PR revision
`9bbe47d3f6c84a05a7bb61112385d588134f9917`:
[CI run 42147114326](https://github.com/ThriveCompany/mpvtl-registration/actions/runs/42147114326).
All three jobs passed: `gates`, `isolated-build`, `synthetic-database`.
The subsequent report/audit snapshot commit changes documentation only; its
exact PR-head SHA and CI result are recorded in the PR description for re-review.

| Check | Current result |
| --- | --- |
| Baseline branch/HEAD/working tree | PASS before branch creation |
| Docker Linux engine | BLOCKED: Docker Desktop Linux engine pipe unavailable |
| Interactive PostgreSQL fixture setup / browser flow | NOT RUN: requires the unavailable local engine |
| Hosted synthetic PostgreSQL setup/idempotency | PASS at `9bbe47d3f6c84a05a7bb61112385d588134f9917`: two setup runs and exact synthetic fixture verification |
| Dependency installation | PASS; dev dependencies and lockfile added; installation lifecycle scripts disabled |
| Prisma client generation | PASS; no database connection |
| Local TypeScript validation | PASS, exit 0; route types generated first |
| Local lint | PASS, exit 0; zero errors and six existing hook warnings |
| Local automated tests | PASS: 5 files, 25 tests, exit 0 |
| Hosted lint/typecheck/tests | PASS: run 42147114326 at `9bbe47d3f6c84a05a7bb61112385d588134f9917`, all 25 tests; six existing hook warnings remain |
| Clean-checkout `npm run build` | PASS in `isolated-build`, job `127661160181`: prebuild cleanup, compilation, type/lint validation, static generation 34/34 and final optimization completed, exit 0 |
| Initial failed checks | Explicitly superseded: worker-start/cold-import timeouts and JSX lint error; fixed with single thread, collection-time route imports and unchanged rendered apostrophe |
| Critical security attribution | COMPLETE for the current registry snapshot: production `next@15.5.15` and optional production `dompurify@3.4.5`, four critical advisory matches, all present at the original baseline; no introduced package/advisory pairs |
| Full npm remediation/metavulnerability calculation | INCOMPLETE: both manifest/lock-only audit retries timed out at 150 seconds; registry bulk advisory attribution succeeded. Historic 27-entry aggregate is not a fresh count or a count of individual advisories |
| Second Paystack project preservation | PASS: tracked-file/status fingerprint unchanged, including all 25 previously changed/deleted paths |
| Main branch | PASS: remains `710e7136d7c2f9686c527fdcfb155a7a72df0409` locally and as PR base |

Direct application dependencies are unchanged. Adding test tooling updates two
shared transitive resolutions: nanoid 3.3.12 -> 3.3.20 and source-map-js 1.2.1 ->
1.2.2. Retain npm's generated compatible tree: reverting only these entries caused
`npm ci` to reject the lockfile and was corrected. Check the current PR-head CI
result. The current linked run proves clean `npm ci --ignore-scripts`, Prisma
generation, lint, typecheck, all 25 tests, isolated production-mode compilation
and synthetic schema/fixture setup on Linux. No release or deployment was run.

## Review correction: safe build gate

The new `isolated-build` job has its own clean checkout and install. Image/tool
acquisition occurs first, then `npm run build:isolated` invokes the unchanged
`npm run build` and prebuild script in a local Docker container. NODE_ENV is
`production`; DB URL points to synthetic loopback port 1, JWT/public URL are
synthetic, SMTP/integrations are blank, and dotenv files cause refusal.
`--network=none` blocks external/production access; no DB service, host home or
credentials directory is mounted. Container root is read-only; only checkout
and temporary `/tmp` are writable. No import mocks, skipped generation or
network restriction bypass was used to make the build succeed.

Tested image: `node:24.14.1-bookworm`, resolved digest
`sha256:80fc934952c8f1b2b4d39907af7211f8a9fff1a4c2cf673fb49099292c251cec`.
The tag can be rebuilt; CI records the resolved digest on every run. Build
artifacts contain synthetic settings and must not be deployed. The build passed
with no unsafe-access blocker. Six existing hook warnings and tooling/Action
deprecation notices remain; they were not suppressed or upgraded in this batch.

## Review correction: dependency attribution

The registry advisory API was queried separately for the original baseline
`710e7136d7c2f9686c527fdcfb155a7a72df0409` and reviewed `f00a60a` lockfiles.
The correction leaves `package-lock.json` and all dependency versions unchanged.
Both critical packages are production dependencies, not development-only:

- `next@15.5.15`, direct: GHSA-p293-qw3h-jr36 (Windows RCE),
  GHSA-2xp9-vwfh-vxw4 (AVIF optimizer RCE), GHSA-2464-fhr4-w9xw (SVG/glibc RCE).
- `dompurify@3.4.5`, optional production dependency of `jspdf@4.2.1`:
  GHSA-cg2g-xh64-v4q7 (template/shadow-root sanitization bypass).

All four advisory matches and versions predate WO-03. No newly introduced
package/advisory pair was found at any severity in this snapshot. This does not
prove production exploitability or replace a separately reviewed remediation
batch. No upgrade, override, `npm audit fix` or exploit test was performed.
See [full attribution, scope, preconditions and limits](../security/WO_03_SECURITY_ATTRIBUTION.md)
and [machine-readable evidence](../security/WO_03_AUDIT_2026-11-06.json).

The test runner is configured for one thread worker to reduce process startup
overhead. No production connections, production migrations, legacy staff seeds, email or payments were
used to validate this batch. The separate CI database smoke check exercises
synthetic schema/fixtures only; end-to-end browser behaviour is not established.

## Findings and follow-up

VERIFIED: four catalogue GET callers can write; partial failure and relationship
backfill behaviour is documented and preserved. Fixed staff credentials exist
in the legacy public seed; values and identities are deliberately omitted.
SMTP fallback can log personal message content. The primary app has a payment
placeholder and no payment ledger; the separate prototype is not a drop-in fit.

UNKNOWN: deployed revision/build, PM2 cwd, nginx routing, migration state,
credential use in production, actual vulnerability reachability and backup restorability.
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
