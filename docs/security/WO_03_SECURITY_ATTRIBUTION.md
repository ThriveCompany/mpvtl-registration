# WO-03 critical dependency attribution — 6 November 2026

## Evidence and comparison

VERIFIED: npm Registry's security advisory bulk API identifies **two packages
with critical advisories**: `next@15.5.15` and `dompurify@3.4.5`.
There are four matching critical advisory records across those two packages.
Both versions and all four critical advisory matches exist in both:

- Original baseline: `710e7136d7c2f9686c527fdcfb155a7a72df0409`.
- Coordinator-reviewed WO-03: `f00a60ab8463cd200cee93be361b675b93752b3b`.

The bounded correction does not change package versions, dependency declarations
or the lockfile. The original install summary of 27 findings, including two
critical entries, is historical aggregate evidence; its original full JSON was
not retained. This is a fresh attribution using the same locked versions, not a
claim to reconstruct the exact historical registry response.

The machine-readable [snapshot](WO_03_AUDIT_2026-11-06.json) records registry
advisory IDs, URLs, ranges and matching lockfile nodes/scopes for both revisions.
Only public package names and versions were sent to:
`POST https://registry.npmjs.org/-/npm/v1/security/advisories/bulk`.
No application data, credentials, install, seed or upgrade was involved.
Registry ranges were matched against locked versions using npm's `semver` package.

## Critical packages and advisories

| Package and locked version | Scope/path | Advisory and impact | WO-03 attribution |
| --- | --- | --- | --- |
| `next@15.5.15` | Direct **production** dependency | [GHSA-p293-qw3h-jr36 / CVE-2026-75604](https://github.com/advisories/GHSA-p293-qw3h-jr36): Windows-hosted server RCE; affected `>=13.4.0 <15.5.24` | Pre-existing, version unchanged |
| `next@15.5.15` | Direct **production** dependency | [GHSA-2xp9-vwfh-vxw4](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4): AVIF image-optimization RCE through an upstream library; affected `>=10.0.0 <15.5.24` | Pre-existing, version unchanged |
| `next@15.5.15` | Direct **production** dependency | [GHSA-2464-fhr4-w9xw / CVE-2026-96889](https://github.com/advisories/GHSA-2464-fhr4-w9xw): SVG image-optimization RCE on glibc Linux; affected `>=10.0.0 <=15.5.27` | Pre-existing, version unchanged |
| `dompurify@3.4.5` | Optional transitive **production** dependency: root `jspdf@4.2.1` → optional `dompurify`; lock node is not marked dev | [GHSA-cg2g-xh64-v4q7](https://github.com/advisories/GHSA-cg2g-xh64-v4q7): template-sanitization bypass involving attached shadow roots and non-default DOM/template settings; affected `>=3.4.4 <=3.4.16` | Pre-existing, version unchanged |

Optional is not synonymous with development-only. A production install that
includes jsPDF's optional dependencies can include DOMPurify. The application
imports jsPDF in `app/api/admin/analytics/report/route.ts`; the inspected app/lib
source does not directly import DOMPurify or call jsPDF's `.html()` method.
That narrows demonstrated reachability; it does not prove the dependency is safe.

## Development dependencies versus production dependencies

Scope comes from each lockfile node's `dev` marker, checked against the root
manifest and the jsPDF optional-dependency relationship. Runtime dependencies
remain classified as production even if build/tests also use them.

None of the critical matches is development-only. WO-03 adds dev tools
`vitest` and `@eslint/eslintrc`; neither has a critical match in this snapshot.
The comparison finds **zero newly introduced package/advisory pairs** across
all severities in the reviewed lockfile. This is a result for this registry
snapshot and these versions, not a guarantee about future disclosures.

| Snapshot | Critical advisory matches | High | Moderate | Low |
| --- | --- | --- | --- | --- |
| Original baseline | 4 | 41 | 40 | 9 |
| Reviewed WO-03 | 4 | 35 | 39 | 9 |

These are **package/advisory matches**, not npm's propagated vulnerable-package
totals. Do not compare 87 reviewed matches directly with the historic 27 npm
entries. The snapshot retains dev/production scope per matched node so reviewers
can distinguish tooling exposure from production exposure.

## Limits and recommended next decision

Full `npm audit --package-lock-only --ignore-scripts --json --no-fund` was retried
in two temporary manifest/lock-only directories, one per revision. Both timed out
at 150 seconds. Thus npm's remediation/metavulnerability calculation remains
incomplete; critical attribution is supplied by the successful authoritative
registry API instead. No `npm audit fix`, forced install, override or upgrade ran.

Runtime exploitability is UNKNOWN: the deployed OS, Next/sharp versions, image
optimizer paths and relevant DOM/template settings are not verified. The Windows
advisory is OS-specific; the SVG advisory explicitly also concerns glibc Linux.
The source lock has `sharp@0.34.5`, below the SVG advisory's stated `0.35.5`
workaround. Do not dismiss all Next findings because a public response mentioned
Ubuntu, or assert that DOMPurify is exploitable solely because it is installed.

Recommend a separately reviewed security-remediation batch before release:
confirm deployed versions/configuration read-only, select compatible fixes,
assess every applicable advisory (not only these four), and test registration,
image handling and PDF exports. Published fix versions are evidence for that
review, not authorization to upgrade in WO-03. No exploits were attempted.
