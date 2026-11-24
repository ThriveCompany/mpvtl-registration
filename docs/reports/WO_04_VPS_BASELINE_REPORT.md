# WO-04: Production VPS Baseline Verification — public review copy

**Inspection date:** 24 November 2026, Africa/Lagos (UTC+01:00).
**Operator:** Codex. **Review owner:** MPVTL coordinator.
**Status:** Non-database baseline collected; remaining migration verification **BLOCKED**.

This is a deliberately redacted derivative of the complete local inspection
report. The complete local report is preserved unchanged and is not committed.
This document contains summarized findings, not raw command output or logs.
Observations describe the inspection date; they do not establish current state
at any later review or deployment.

The Delivery Director explicitly authorized the inspected SSH target and account
for the existing WO-04 scope. Strict host-key verification matched the existing
trusted record. The earlier SSH authorization gate was cleared. This establishes
continuity with that trusted record, not independent provider-console ownership
attestation. Target identifiers, account names and trust-record details are
withheld from this public copy.

The subsequent coordinator instruction, carrying Delivery Director authorization,
permits this documentation-only commit, push and draft PR. It does not authorize
further infrastructure inspection, database access changes, implementation,
deployment or merge. See the [public work-order copy](../../20_WORK_ORDERS/MPVTL_WO-04_VPS_Baseline_Read_Only.md).

## Evidence register and limits

Evidence IDs refer to the complete local report. Their descriptions below are
public-safe summaries, not links to publicly available raw evidence. Independent
reviewers can assess these documented conclusions and compare the public Git
revisions; reproducing private infrastructure observations requires separately
authorized access. No raw server evidence is included in this PR.

| ID | Collection method and scope |
| --- | --- |
| E07 | Explicit target/account authorization, local SSH configuration review, DNS and strict trusted-host identity check |
| E08 | Selected OS, web-server configuration, listener and process metadata |
| E09 | Correlation of selected web upstream, listening process, working directory, executable and existing process supervisor |
| E10 | Read-only Git metadata, on-disk build metadata, installed package metadata, migration-source checksums and filtered configuration-presence checks |
| E11 | WordPress file headers and repository-marker checks; PHP handler/process correlation and installed package records |
| E12 | Bounded source-tracking counts, filtered access-control metadata, backup-file metadata, direct labelled schedule search and rotation configuration |
| E13 | Local committed migration-blob checksum comparison with the inspected source files |

Five noninteractive SSH sessions collected filtered metadata. No inspection
files were uploaded. Selected configuration was parsed for approved metadata;
configuration and environment contents were not dumped or published. No student
records, database rows, production logs or backup contents were read. The process
supervisor CLI and WordPress runtime were not invoked.

## Application mapping

**VERIFIED (E08–E11):** Both applications are on the same authenticated VPS and
share the host web server. They have separate application directories and
execution models. The public-safe graphs are:

```text
Registration endpoint
  -> selected nginx site configuration
  -> configured application upstream
  -> observed listening Next.js process
  -> observed runtime working directory
  -> registration Git checkout and on-disk build metadata

Public website endpoint
  -> separate selected nginx site configuration
  -> configured PHP handler
  -> observed PHP-FPM processes
  -> separate WordPress document root and component files
```

Actual directories, sockets, upstream addresses, ports, process identifiers and
account details are retained only in the complete local report. The runtime
working-directory relationship was observed directly, independently of names.

**INFERRED:** Live requests follow the enabled configuration inspected on disk.
Loaded configuration versus last reload was not independently attested. No
public request trace or configuration reload was performed.

**UNKNOWN:** Physical storage separation, shared cache, effective database/schema
relationships, pipeline separation, complete effective upload/timeouts and live
certificate validity. Selected TLS configuration metadata alone does not prove
the live negotiated configuration.

## Registration source provenance and drift

**VERIFIED (E10):** The actual runtime directory contains a Git checkout whose
credential-free origin identifies `ThriveCompany/mpvtl-registration`. The
inspected production checkout reports branch `main` and HEAD
[`710e7136d7c2f9686c527fdcfb155a7a72df0409`](https://github.com/ThriveCompany/mpvtl-registration/commit/710e7136d7c2f9686c527fdcfb155a7a72df0409).
It differs from the reviewed WO-03 revision
[`0ee40045576447ed7453702753c5131e9e523a27`](https://github.com/ThriveCompany/mpvtl-registration/commit/0ee40045576447ed7453702753c5131e9e523a27).

The production checkout is not a clean representation of its reported HEAD:

- **12 tracked changes** were reported without reading diffs. Eleven identified
  paths span registration and administrative APIs/UI, email verification,
  configuration, dependency lockfile and database schema. One other tracked
  change was not itemized.
- **38 untracked files** were counted in bounded source directories. This is not
  an exhaustive inventory of the server or its data.
- **20 migration-source files** were observed: 13 original files and seven
  additional untracked files. All 13 originals match committed source migration
  hashes at the reviewed WO-03 revision (E13). This does not prove application
  to a database.
- On-disk build metadata predates the observed application process start. The
  build has no established source-SHA attestation.

**INFERRED:** The build timing is consistent with reuse of an existing build.
It does not identify the source that produced it.

**UNKNOWN:** Authorship and approval of production drift, which changes are
represented in the running build, whether the additional migrations were
applied, and whether payment functionality is active. Source-file names and
installed gateway components are not payment-activation evidence.

The reported checkout HEAD must not be presented as a reproducible deployment
revision. Reconciliation requires a separately authorized review that preserves
all production modifications and untracked files.

## Runtime, WordPress and access boundaries

**VERIFIED (E08–E11):** Registration uses an observed Node/Next.js runtime with
an existing PM2 parent process. Installed package metadata was collected. The
production Node major is 20; the reviewed WO-03 development/CI pin is Node
24.14.1. Build/runtime compatibility therefore remains a release prerequisite.
Installed package versions are not attestations of loaded process memory or
vendor integrity. Exact production versions are withheld from this public copy.

**VERIFIED:** The registration process operates with elevated OS privileges.
Service isolation requires separate security review. Listener and filtered
firewall metadata were inspected; these do not establish complete external
reachability, provider-firewall or effective kernel-rule coverage.

**VERIFIED:** The registration source schema declares PostgreSQL. PostgreSQL
and MySQL service/package metadata were observed. **INFERRED:** The two
applications use distinct database engines. **UNKNOWN:** Registration's actual
database endpoint, schema and live connection-to-server relationship. No
database connection was used to confirm these relationships.

**VERIFIED (E11):** WordPress files are available on the server. No Git marker
was found at its root, parent or inspected component directories. Availability
of canonical managed history elsewhere is **UNKNOWN**.

The file-header inventory contains **seven themes, 58 ordinary plugin headers
and two must-use plugin files**. It includes Kadence, Elementor, WooCommerce,
payment integrations, role/snippet mechanisms and backup tools. A project-named
must-use file is a customization candidate based only on its name/header.
Exact component versions and the detailed installed-security-tool inventory
are withheld. **Installed does not mean active.** No upstream integrity
comparison, plugin execution, activation query or user/private-content read ran.

**UNKNOWN:** Active theme/plugins, effective roles, stored snippets, custom
component behavior/provenance, gateway settings, scheduled jobs and effective
caching. A bounded drop-in/configuration check does not prove caching absent.

**VERIFIED (E10):** Upload-directory ownership/access metadata and presence-only
SMTP configuration metadata were collected. **UNKNOWN:** Effective runtime
overrides, mail delivery and complete storage/access behavior. No upload file
or student record was opened and no email was sent. Ownership details and
configuration key/value information are withheld.

## Backups, retention and recovery

**VERIFIED (E12):** A WordPress backup artifact was observed by file metadata
only. Its contents, completeness, successful completion and restore validity
were not checked. Other bounded directory checks found no matching immediate
archives; this does not establish absence of other backups.

No direct project-labelled backup entry was found in the checked schedule
files. Generic scripts, database-managed schedules, provider and off-host
backups were not established. Web/PHP log-rotation configuration was observed;
successful execution and full coverage were not verified. Application log
retention remains unverified. No production logs or archives were read.

**UNKNOWN:** Backup cadence and retention, recent successful backup, off-host
coverage, backup access restrictions, last independently evidenced restore,
staging isolation and rollback readiness. A backup-storage access-control
question remains for the operations owner; sensitive location details are
withheld. Installed backup plugins alone establish none of these controls.

## Remaining database gate

**BLOCKED:** No existing approved read-only database role or permitted access
mechanism was identified in the supplied authority. Role existence and actual
privileges are **UNKNOWN**, not proved absent. Authorized OS-level inspection
does not demonstrate the required database role.

Zero database connections or SQL queries were attempted. No administrative or
application credential, account impersonation or writable-role workaround was
substituted. Applied migrations, checksums, completion/rollback state and
applied-step counts remain **UNKNOWN**.

The minimum prerequisite is identification of an existing approved read-only
role, the intended database and an authorized existing access mechanism for
the work order's migration-metadata scope. Credentials must not be placed in
GitHub or chat. Creating accounts/grants or changing access is outside this
authorization. The coordinator may accept this limitation explicitly or arrange
separately bounded access work.

## Risk assessment and follow-up ownership

| Priority | Finding | Owner and prerequisite |
| --- | --- | --- |
| High | Material source drift and no running-build source attestation | Coordinator / Delivery Director: separately authorize provenance reconciliation before deployment; preserve existing server files |
| Blocking for migration verification | Approved existing read-only database access unidentified | Delivery Director / database operations owner: establish scoped existing access or explicitly accept the limitation |
| High | Elevated application-process privileges | Operations / security owner: review service isolation in a separate approved batch |
| High | Installed production dependency metadata matches previously attributed security-risk versions; reachability untested | Coordinator / security owner: separate remediation review based on actual runtime inventory and drift; no remediation performed here |
| High | Restore, staging and rollback readiness unverified | Delivery Director / operations owner: obtain evidence; separately authorize any restore drill |
| Medium | Production and reviewed development Node majors differ | Engineering / operations: validate compatibility before release |
| Medium | Backup access restrictions unverified | WordPress / operations owner: bounded access-control review; no archive download authorized |
| Medium | Large installed component inventory, active/custom behavior unknown | WordPress owner / coordinator: identify active configuration and canonical source before optimization |
| Medium | Complete application log retention unverified | Operations / privacy owner: metadata review before retention changes |

WO-04 did not perform a fresh advisory scan or establish exploitability. The
prior WO-03 attribution remains separate evidence, not a new security clearance.
Security remediation, WordPress optimization and deployment each require their
own bounded work and review of these unknowns.

## Publication boundary and withheld information

Withheld: SSH target/alias and trust fingerprints; account/host identities;
absolute server/workstation paths; internal/public infrastructure addresses,
ports, sockets and PIDs; exact runtime/build identifiers, timestamps and version
fingerprints; detailed component inventory and security-tool configuration;
private configuration metadata; migration names and individual hashes; backup
locations/sizes/times; firewall and retention specifics. No credentials,
personal/student information, raw outputs or logs are published.

No new server session was opened for this publication task. The complete local
inspection report and authoritative work-order source were not altered. Only
this public report and the public work-order derivative are included in the
documentation branch. The separate local Paystack project was not accessed or
modified.

Inspection deliberately excluded production writes, package installation,
builds, migrations/seeding, service changes, WordPress execution, payment tests,
vulnerability exploitation, port scans, log/backup-content reads and the public
catalogue GET whose existing behavior can write to the database. Publication
does not resolve the remaining migration gate or authorize release.

PRODUCTION CHANGES: NONE
MAIN BRANCH CHANGES: NONE
WO-04 STATUS: BLOCKED — remaining database verification requires approved existing read-only access; non-database baseline collected.
